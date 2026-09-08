import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

// POST /api/orders/[id]/confirm — staff confirms a pending order, which generates
// one picking task per order line so warehouse staff have concrete work items.
// This is also where stock gets reserved: reservedQty increases by each item's
// quantity, so other orders can no longer claim it (see /lib/inventory available
// = quantity - reservedQty). Reservation is released either when picked (moves
// from reserved to actually deducted) or if the order is cancelled.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const orderId = Number(id);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return fail("الطلب غير موجود", 404);
  if (order.status !== "pending") return fail("لا يمكن تأكيد طلب في هذه الحالة");

  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  if (items.length === 0) return fail("لا يوجد أصناف في هذا الطلب");

  // NOTE (D1): db.batch() is fully atomic here since no statement depends on
  // another's runtime result — this is the closest thing to a real
  // transaction that D1 supports.
  const statements = [
    ...items.map((item) => db.insert(schema.pickingTasks).values({ orderId, orderItemId: item.id, status: "pending" })),
    ...items.map((item) =>
      db
        .update(schema.products)
        .set({ reservedQty: sql`${schema.products.reservedQty} + ${item.quantity}` })
        .where(eq(schema.products.id, item.productId))
    ),
    db.update(schema.orders).set({ status: "picking" }).where(eq(schema.orders.id, orderId)),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.batch(statements as any);

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, order.customerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "order_confirmed",
      title: "تم تأكيد طلبك",
      message: `تم تأكيد الطلب رقم ${order.orderNumber} وبدأت مرحلة التجهيز.`,
    });
  }

  return ok({ confirmed: true, tasksCreated: items.length });
}