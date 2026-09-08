import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const ApproveSchema = z.object({
  actualSpaceM2: z.number().min(0).default(0),
});

// POST /api/receiving/[id]/approve — admin reviews the receiving report and
// approves it. THIS is where inventory actually moves: received qty -> IN
// movement, damaged qty -> DAMAGE movement, storage usedM2 increases, and the
// customer gets notified. Only reachable from "received" status.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const receivingOrderId = Number(id);

  const [ro] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  if (!ro) return fail("أمر الاستلام غير موجود", 404);
  if (ro.status !== "received") return fail("يجب تسجيل الاستلام أولًا قبل الموافقة");

  const body = await req.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  const items = await db.select().from(schema.receivingItems).where(eq(schema.receivingItems.receivingOrderId, receivingOrderId));
  for (const item of items) {
    if (item.receivedQty > 0) {
      await recordMovement({
        productId: item.productId,
        type: "IN",
        quantity: item.receivedQty,
        userId: user.id,
        reason: `استلام من أمر الاستلام رقم ${receivingOrderId}`,
        referenceType: "receiving_order",
        referenceId: receivingOrderId,
      });
    }
    if (item.damagedQty > 0) {
      await recordMovement({
        productId: item.productId,
        type: "DAMAGE",
        quantity: 0, // zero-effect ledger entry: logs the event without double-touching balance
        userId: user.id,
        reason: `تالف عند الاستلام — أمر رقم ${receivingOrderId}`,
        referenceType: "receiving_order",
        referenceId: receivingOrderId,
      });
    }
  }

  await db.update(schema.receivingOrders).set({ status: "approved", approvedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.receivingOrders.id, receivingOrderId));

  if (parsed.data.actualSpaceM2 > 0) {
    const [allocation] = await db
      .select()
      .from(schema.storageAllocations)
      .where(
        and(
          eq(schema.storageAllocations.customerId, ro.customerId),
          eq(schema.storageAllocations.warehouseId, ro.warehouseId),
          eq(schema.storageAllocations.status, "active")
        )
      );
    if (allocation) {
      const newUsed = allocation.usedM2 + parsed.data.actualSpaceM2;
      await db.update(schema.storageAllocations).set({ usedM2: newUsed }).where(eq(schema.storageAllocations.id, allocation.id));
    }
  }

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, ro.customerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "receiving_approved",
      title: "تم استلام بضاعتك",
      message: `تم استلام وتسجيل بضاعتك الخاصة بأمر الاستلام رقم ${receivingOrderId} في المخزن.`,
    });

    const [customerUser] = await db.select().from(schema.users).where(eq(schema.users.id, customer.userId));
    if (customerUser?.email) {
      await sendEmail({
        to: customerUser.email,
        subject: `تم استلام بضاعتك — أمر رقم ${receivingOrderId}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
            <h2>تم استلام بضاعتك ✅</h2>
            <p>مرحبًا ${customer.companyName}،</p>
            <p>تم استلام وتسجيل بضاعتك الخاصة بأمر الاستلام رقم <strong>${receivingOrderId}</strong> في المخزن بنجاح.</p>
            <p>يمكنك متابعة تفاصيل مخزونك من لوحة التحكم الخاصة بك.</p>
          </div>
        `,
      });
    }
  }

  const [fresh] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  return ok(fresh);
}