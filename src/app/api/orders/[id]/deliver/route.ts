import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const orderId = Number((await params).id);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return fail("الطلب غير موجود", 404);
  if (order.status !== "shipped") return fail("لا يمكن تأكيد التسليم قبل شحن الطلب");

  const [shipment] = await db.select().from(schema.shipments).where(eq(schema.shipments.orderId, orderId));
  if (!shipment) return fail("لا توجد شحنة مرتبطة بالطلب", 409);

  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.update(schema.shipments).set({ status: "delivered", deliveredAt: now }).where(eq(schema.shipments.id, shipment.id)),
    db.update(schema.orders).set({ status: "delivered" }).where(eq(schema.orders.id, orderId)),
  ]);

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, order.customerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "order_delivered",
      title: "تم تسليم طلبك",
      message: `تم تأكيد تسليم الطلب رقم ${order.orderNumber}.`,
    });

    const [customerUser] = await db.select().from(schema.users).where(eq(schema.users.id, customer.userId));
    if (customerUser?.email) {
      await sendEmail({
        to: customerUser.email,
        subject: `تم تسليم طلبك — رقم ${order.orderNumber}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
            <h2>تم تسليم طلبك بنجاح 📦</h2>
            <p>مرحبًا ${customer.companyName}،</p>
            <p>نود إعلامك بأنه تم تأكيد تسليم طلبك رقم <strong>${order.orderNumber}</strong> بنجاح.</p>
            <p>شكرًا لثقتك بنا!</p>
          </div>
        `,
      });
    }
  }

  return ok({ delivered: true });
}