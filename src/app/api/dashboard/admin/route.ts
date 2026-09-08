import { db, schema } from "@/db";

import { requireUser, ok, isResponse } from "@/lib/api-helpers";

function startOfTodayUnix() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}
function startOfMonthUnix() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

// GET /api/dashboard/admin — the numbers behind the Admin Dashboard "Overview" cards
export async function GET() {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;

  const [customers, allocations, orders, returnsRows, products, invoicesRows] = await Promise.all([
    db.select().from(schema.customers),
    db.select().from(schema.storageAllocations),
    db.select().from(schema.orders),
    db.select().from(schema.returns),
    db.select().from(schema.products),
    db.select().from(schema.invoices),
  ]);

  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalCapacity = (await db.select().from(schema.warehouses)).reduce((s, w) => s + w.totalCapacityM2, 0);
  const occupied = allocations.filter((a) => a.status === "active").reduce((s, a) => s + a.allocatedM2, 0);

  const todayStart = startOfTodayUnix();
  const monthStart = startOfMonthUnix();

  const ordersToday = orders.filter((o) => o.createdAt >= todayStart).length;
  const ordersThisMonth = orders.filter((o) => o.createdAt >= monthStart).length;

  const monthlyRevenue = invoicesRows.filter((i) => i.createdAt >= monthStart).reduce((s, i) => s + i.total, 0);
  const pendingPayments = invoicesRows.filter((i) => i.status === "pending" || i.status === "overdue" || i.status === "partially_paid").reduce((s, i) => s + i.total, 0);

  const lowStock = products.filter((p) => p.quantity <= p.minStock);

  return ok({
    totalCustomers: customers.length,
    activeCustomers,
    totalStorageM2: totalCapacity,
    occupiedStorageM2: occupied,
    availableStorageM2: Math.max(totalCapacity - occupied, 0),
    occupancyPercent: totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 1000) / 10 : 0,
    monthlyRevenue,
    pendingPayments,
    ordersToday,
    ordersThisMonth,
    returnsCount: returnsRows.length,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 10),
  });
}
