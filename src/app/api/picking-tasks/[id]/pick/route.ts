import { db, schema } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { z } from "zod";

const PickSchema = z.object({ pickedQty: z.number().int().positive() });

// POST /api/picking-tasks/[id]/pick — "Confirm Pick": deducts stock through the ledger
// AND releases the reservation made at order-confirm time (reservedQty decreases by
// the same amount, since that stock has now actually left rather than just being held).
// Then auto-advances the parent order to "picked" once every task on it is done.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const taskId = Number(id);

  const [task] = await db.select().from(schema.pickingTasks).where(eq(schema.pickingTasks.id, taskId));
  if (!task) return fail("مهمة التجهيز غير موجودة", 404);
  if (task.status !== "pending") return fail("تم التعامل مع هذه المهمة بالفعل");

  const body = await req.json().catch(() => null);
  const parsed = PickSchema.safeParse(body);
  if (!parsed.success) return fail("الكمية المطلوبة غير صحيحة");

  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, task.orderItemId));
  if (!item) return fail("صنف الطلب غير موجود", 404);

  if (parsed.data.pickedQty !== item.quantity) return fail(`يجب التقاط الكمية كاملة: ${item.quantity}`);

  try {
    await recordMovement({
      productId: item.productId,
      type: "OUT",
      quantity: parsed.data.pickedQty,
      userId: user.id,
      reason: `Picking لطلب رقم ${task.orderId}`,
      referenceType: "order",
      referenceId: task.orderId,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "فشل خصم المخزون");
  }

  await db
    .update(schema.products)
    .set({ reservedQty: sql`MAX(${schema.products.reservedQty} - ${parsed.data.pickedQty}, 0)` })
    .where(eq(schema.products.id, item.productId));

  await db
    .update(schema.pickingTasks)
    .set({ status: "picked", pickedQty: parsed.data.pickedQty, assignedTo: user.id, completedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.pickingTasks.id, taskId));

  const remaining = await db
    .select()
    .from(schema.pickingTasks)
    .where(and(eq(schema.pickingTasks.orderId, task.orderId), eq(schema.pickingTasks.status, "pending")));

  if (remaining.length === 0) {
    await db.update(schema.orders).set({ status: "picked" }).where(eq(schema.orders.id, task.orderId));
  }

  return ok({ picked: true, orderFullyPicked: remaining.length === 0 });
}