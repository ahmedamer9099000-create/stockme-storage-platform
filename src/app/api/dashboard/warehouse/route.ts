import { db, schema } from "@/db";
import { requireUser, ok, isResponse } from "@/lib/api-helpers";

function startOfTodayUnix() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

// GET /api/dashboard/warehouse — "Warehouse Dashboard": today's receiving/picking/packing/shipping/returns queues
export async function GET() {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const todayStart = startOfTodayUnix();
  const [receiving, picking, packing, shipments, returnsRows] = await Promise.all([
    db.select().from(schema.receivingOrders),
    db.select().from(schema.pickingTasks),
    db.select().from(schema.packingTasks),
    db.select().from(schema.shipments),
    db.select().from(schema.returns),
  ]);
  return ok({
    receivingToday: receiving.filter((r) => r.createdAt >= todayStart).length,
    receivingPending: receiving.filter((r) => r.status === "pending").length,
    pickingToday: picking.filter((p) => p.createdAt >= todayStart).length,
    pickingPending: picking.filter((p) => p.status === "pending").length,
    packingToday: packing.filter((p) => p.createdAt >= todayStart).length,
    packingPending: packing.filter((p) => p.status === "pending").length,
    shippingToday: shipments.filter((s) => (s.shippedAt ?? 0) >= todayStart).length,
    returnsToday: returnsRows.filter((r) => r.createdAt >= todayStart).length,
    returnsPending: returnsRows.filter((r) => r.status !== "processed").length,
    tasksPending: picking.filter((p) => p.status === "pending").length + packing.filter((p) => p.status === "pending").length,
  });
}