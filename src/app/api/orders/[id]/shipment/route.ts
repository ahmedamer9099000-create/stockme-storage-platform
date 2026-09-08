import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const ShipSchema = z.object({
  courier: z.string().min(1),
  trackingNumber: z.string().optional(),
  shippingCost: z.number().optional(),
});

// POST /api/orders/[id]/shipment — records shipment info manually (courier API integration is a
// documented future extension point, not implemented — see ARCHITECTURE.md "Integration Layer").
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const orderId = Number(id);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return fail("الطلب غير موجود", 404);
  if (order.status !== "packed") return fail("يجب تغليف الطلب أولًا قبل الشحن");

  const body = await req.json().catch(() => null);
  const parsed = ShipSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  const [shipment] = await db
    .insert(schema.shipments)
    .values({ orderId, ...parsed.data, status: "shipped", shippedAt: Math.floor(Date.now() / 1000) })
    .returning();

  await db.update(schema.orders).set({ status: "shipped" }).where(eq(schema.orders.id, orderId));

  // Free up the storage space taken by the shipped goods: sum each order
  // item's quantity × the product's per-unit space, then subtract that from
  // the customer's active storage allocation (never letting it go below 0).
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  if (items.length > 0) {
    let shippedSpaceM2 = 0;
    for (const item of items) {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, item.productId));
      if (product) shippedSpaceM2 += item.quantity * product.spaceM2;
    }

    if (shippedSpaceM2 > 0) {
      const [allocation] = await db
        .select()
        .from(schema.storageAllocations)
        .where(and(eq(schema.storageAllocations.customerId, order.customerId), eq(schema.storageAllocations.status, "active")));

      if (allocation) {
        const newUsed = Math.max(allocation.usedM2 - shippedSpaceM2, 0);
        await db.update(schema.storageAllocations).set({ usedM2: newUsed }).where(eq(schema.storageAllocations.id, allocation.id));
      }
    }
  }

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, order.customerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "order_shipped",
      title: "تم شحن طلبك",
      message: `تم شحن طلبك رقم ${order.orderNumber}${parsed.data.trackingNumber ? ` — رقم التتبع: ${parsed.data.trackingNumber}` : ""}.`,
    });

    const [customerUser] = await db.select().from(schema.users).where(eq(schema.users.id, customer.userId));
    if (customerUser?.email) {
      await sendEmail({
        to: customerUser.email,
        subject: `تم شحن طلبك — رقم ${order.orderNumber}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
            <h2>تم شحن طلبك 🚚</h2>
            <p>مرحبًا ${customer.companyName}،</p>
            <p>تم شحن طلبك رقم <strong>${order.orderNumber}</strong> عبر شركة الشحن <strong>${parsed.data.courier}</strong>.</p>
            ${parsed.data.trackingNumber ? `<p>رقم التتبع: <strong>${parsed.data.trackingNumber}</strong></p>` : ""}
          </div>
        `,
      });
    }
  }

  return ok(shipment, 201);
}