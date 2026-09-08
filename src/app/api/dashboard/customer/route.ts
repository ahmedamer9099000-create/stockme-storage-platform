import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

// GET /api/dashboard/customer — the numbers behind the Customer Dashboard "Overview" cards
export async function GET() {
  const user = await requireUser(["CUSTOMER"]);
  if (isResponse(user)) return user;
  if (!user.customerId) return fail("لا يوجد حساب عميل مرتبط", 400);

  const [products, orders, returnsRows, invoicesRows, allocations] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.customerId, user.customerId)),
    db.select().from(schema.orders).where(eq(schema.orders.customerId, user.customerId)),
    db.select().from(schema.returns).where(eq(schema.returns.customerId, user.customerId)),
    db.select().from(schema.invoices).where(eq(schema.invoices.customerId, user.customerId)),
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, user.customerId)),
  ]);

  const activeAllocation = allocations.find((a) => a.status === "active");
  const totalQuantity = products.reduce((s, p) => s + p.quantity, 0);
  const inventoryValue = 0; // no per-unit cost field captured in this MVP — see ARCHITECTURE.md TODOs

  return ok({
    totalProducts: products.length,
    totalQuantity,
    inventoryValue,
    usedSpaceM2: activeAllocation?.usedM2 ?? 0,
    allocatedSpaceM2: activeAllocation?.allocatedM2 ?? 0,
    availableSpaceM2: activeAllocation ? Math.max(activeAllocation.allocatedM2 - activeAllocation.usedM2, 0) : 0,
    currentOrders: orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
    completedOrders: orders.filter((o) => o.status === "delivered").length,
    returnsCount: returnsRows.length,
    outstandingInvoices: invoicesRows.filter((i) => i.status !== "paid").length,
    outstandingAmount: invoicesRows.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0),
  });
}
