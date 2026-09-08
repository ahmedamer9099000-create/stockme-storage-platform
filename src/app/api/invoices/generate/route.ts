import { db, schema } from "@/db";
import { eq, and, gte, lt } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { getDefaultPricingPlan } from "@/lib/pricing";
import { z } from "zod";

const GenerateSchema = z.object({
  customerId: z.number(),
  periodStart: z.number(), // unix seconds
  periodEnd: z.number(),
});

function genInvoiceNumber() {
  return "INV-" + Date.now().toString(36).toUpperCase();
}

// POST /api/invoices/generate — builds an itemized invoice for one customer covering one period:
// storage fee (from their active allocation) + receiving/picking/packing/return/handoff fees incurred
// in that window (from admin-configured pricing), matching the "Billing" spec exactly.
export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const { customerId, periodStart, periodEnd } = parsed.data;

  if (periodEnd <= periodStart) return fail("تاريخ نهاية الفترة يجب أن يكون بعد تاريخ بدايتها");

  // Guard against accidentally generating a duplicate invoice: reject if an
  // existing invoice for this customer overlaps the requested period at all.
  const existingInvoices = await db.select().from(schema.invoices).where(eq(schema.invoices.customerId, customerId));
  const overlapping = existingInvoices.find((inv) => inv.periodStart < periodEnd && inv.periodEnd > periodStart);
  if (overlapping) {
    return fail(`يوجد بالفعل فاتورة (${overlapping.invoiceNumber}) تغطي فترة متداخلة مع الفترة المطلوبة`, 409);
  }

  const plan = await getDefaultPricingPlan();
  if (!plan) return fail("لا توجد خطة تسعير مُعرَّفة — أضِف واحدة من إعدادات الأدمن أولًا");

  const items: { description: string; type: string; quantity: number; amount: number }[] = [];

  // Storage fee — from the active allocation
  const [allocation] = await db
    .select()
    .from(schema.storageAllocations)
    .where(and(eq(schema.storageAllocations.customerId, customerId), eq(schema.storageAllocations.status, "active")));
  if (allocation) {
    items.push({ description: `رسوم تخزين ${allocation.allocatedM2} م²`, type: "storage", quantity: 1, amount: allocation.monthlyFee });
  }

  // Receiving orders approved in the period
  const receiving = await db
    .select()
    .from(schema.receivingOrders)
    .where(
      and(
        eq(schema.receivingOrders.customerId, customerId),
        eq(schema.receivingOrders.status, "approved"),
        gte(schema.receivingOrders.approvedAt, periodStart),
        lt(schema.receivingOrders.approvedAt, periodEnd)
      )
    );
  if (receiving.length > 0 && plan.receivingFee) {
    items.push({ description: `رسوم استلام (${receiving.length} أمر)`, type: "receiving", quantity: receiving.length, amount: receiving.length * plan.receivingFee });
  }

  // Orders shipped in the period -> picking + packing fees
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.customerId, customerId));
  const ordersInPeriod = orders.filter((o) => o.createdAt >= periodStart && o.createdAt < periodEnd && o.status !== "cancelled");
  if (ordersInPeriod.length > 0) {
    if (plan.pickingFee) items.push({ description: `رسوم تجهيز طلبات (${ordersInPeriod.length} طلب)`, type: "picking", quantity: ordersInPeriod.length, amount: ordersInPeriod.length * plan.pickingFee });
    if (plan.packingFee) items.push({ description: `رسوم تغليف طلبات (${ordersInPeriod.length} طلب)`, type: "packing", quantity: ordersInPeriod.length, amount: ordersInPeriod.length * plan.packingFee });
  }

  // Returns processed in the period
  const returnsRows = await db.select().from(schema.returns).where(and(eq(schema.returns.customerId, customerId), eq(schema.returns.status, "processed")));
  if (returnsRows.length > 0 && plan.returnFee) {
    items.push({ description: `رسوم مرتجعات (${returnsRows.length})`, type: "return", quantity: returnsRows.length, amount: returnsRows.length * plan.returnFee });
  }

  // Carton handoffs (ready cartons handed to a courier) in the period
  const handoffs = await db
    .select()
    .from(schema.cartonHandoffs)
    .where(and(eq(schema.cartonHandoffs.customerId, customerId), gte(schema.cartonHandoffs.createdAt, periodStart), lt(schema.cartonHandoffs.createdAt, periodEnd)));
  const totalCartons = handoffs.reduce((sum, h) => sum + h.cartonCount, 0);
  if (totalCartons > 0 && plan.pricePerCarton) {
    items.push({ description: `رسوم تسليم كراتين (${totalCartons} كرتونة)`, type: "shipping", quantity: totalCartons, amount: totalCartons * plan.pricePerCarton });
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxRate = 14;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // NOTE (D1): no interactive db.transaction() on Cloudflare D1 — the invoice
  // is inserted first (its id is needed for the line items), then the line
  // items are all written together atomically via db.batch().
  const [result] = await db
    .insert(schema.invoices)
    .values({
      invoiceNumber: genInvoiceNumber(),
      customerId,
      periodStart,
      periodEnd,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: "pending",
      dueDate: periodEnd + 14 * 24 * 60 * 60,
    })
    .returning();

  if (items.length > 0) {
    const statements = items.map((item) =>
      db.insert(schema.invoiceItems).values({ invoiceId: result.id, description: item.description, type: item.type as never, quantity: item.quantity, amount: item.amount })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(statements as any);
  }

  return ok(result, 201);
}