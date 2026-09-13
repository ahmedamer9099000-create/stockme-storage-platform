import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const CreateSchema = z.object({
  warehouseId: z.number().int().positive(),
  allocatedM2: z.number().positive().max(10000),
  durationMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]).default(1),
});

function discountForMonths(plan: { discountPct3m: number; discountPct6m: number; discountPct12m: number } | undefined, months: number) {
  if (!plan) return 0;
  if (months === 3) return plan.discountPct3m;
  if (months === 6) return plan.discountPct6m;
  if (months === 12) return plan.discountPct12m;
  return 0;
}

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  let rows = await db.select().from(schema.storageAllocations);
  if (user.role === "CUSTOMER") rows = rows.filter((r) => r.customerId === user.customerId);
  return ok(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات الحجز غير صحيحة");

  const customerId = user.role === "CUSTOMER" ? user.customerId : undefined;
  const requestedCustomerId = user.role === "CUSTOMER" ? customerId : (body?.customerId as number | undefined);
  if (!requestedCustomerId) return fail("customerId مطلوب");

  const [warehouse] = await db.select().from(schema.warehouses).where(eq(schema.warehouses.id, parsed.data.warehouseId));
  if (!warehouse) return fail("المخزن غير موجود", 404);

  const existing = await db.select().from(schema.storageAllocations).where(
    and(eq(schema.storageAllocations.customerId, requestedCustomerId), eq(schema.storageAllocations.status, "active"))
  );
  if (existing.length) return fail("لديك بالفعل حجز مساحة نشط. يمكنك تعديل الحجز الحالي من خلال الإدارة.", 409);

  const allAllocations = await db.select().from(schema.storageAllocations).where(
    and(eq(schema.storageAllocations.warehouseId, parsed.data.warehouseId), eq(schema.storageAllocations.status, "active"))
  );
  const occupied = allAllocations.reduce((sum, a) => sum + a.allocatedM2, 0);
  const available = Math.max(warehouse.totalCapacityM2 - occupied, 0);
  if (parsed.data.allocatedM2 > available) {
    return fail(`المساحة المطلوبة أكبر من المتاح. المتاح حاليًا ${available} م²`, 409);
  }

  const [plan] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1);
  const baseMonthlyFee = Math.max(parsed.data.allocatedM2 * (plan?.pricePerM2 ?? 0), plan?.minMonthlyFee ?? 0);
  const discountPct = discountForMonths(plan, parsed.data.durationMonths);
  const monthlyFee = baseMonthlyFee * (1 - discountPct / 100);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const endDate = nowSeconds + parsed.data.durationMonths * 30 * 24 * 60 * 60;

  // New bookings require admin approval before they take effect — they're
  // recorded immediately (so capacity accounting reflects the pending
  // reservation) but stay approvalStatus "pending" until an admin acts.
  const [allocation] = await db.insert(schema.storageAllocations).values({
    customerId: requestedCustomerId,
    warehouseId: parsed.data.warehouseId,
    allocatedM2: parsed.data.allocatedM2,
    monthlyFee,
    durationMonths: parsed.data.durationMonths,
    endDate,
    status: "active",
    approvalStatus: "pending",
  }).returning();

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, requestedCustomerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "storage_requested",
      title: "طلب حجز مساحة قيد المراجعة",
      message: `تم استلام طلبك لحجز ${allocation.allocatedM2} م² في ${warehouse.name} لمدة ${parsed.data.durationMonths} شهر، وهو الآن بانتظار موافقة الإدارة.`,
    });
  }

  return ok({ allocation, warehouse, availableAfter: available - allocation.allocatedM2 }, 201);
}