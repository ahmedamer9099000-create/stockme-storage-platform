import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

async function loadScoped(id: number, user: Awaited<ReturnType<typeof requireUser>>) {
  if (isResponse(user)) return null;
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!o) return null;
  if (user.role === "CUSTOMER" && o.customerId !== user.customerId) return null;
  return o;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const order = await loadScoped(Number(id), user);
  if (!order) return fail("الطلب غير موجود", 404);
  const [items, picking, packing, shipment] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)),
    db.select().from(schema.pickingTasks).where(eq(schema.pickingTasks.orderId, order.id)),
    db.select().from(schema.packingTasks).where(eq(schema.packingTasks.orderId, order.id)),
    db.select().from(schema.shipments).where(eq(schema.shipments.orderId, order.id)),
  ]);
  return ok({ order, items, picking, packing, shipment: shipment[0] ?? null });
}

// PATCH — staff can update status/address; only ADMIN/SUPER_ADMIN may change
// paymentStatus (that field should only move via a real recorded payment).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ["status", "shippingAddress"];
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") allowed.push("paymentStatus");
  else if ("paymentStatus" in body) {
    return fail("لا تملك صلاحية تعديل حالة الدفع", 403);
  }

  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const [updated] = await db.update(schema.orders).set(patch).where(eq(schema.orders.id, Number(id))).returning();
  if (!updated) return fail("الطلب غير موجود", 404);
  return ok(updated);
}