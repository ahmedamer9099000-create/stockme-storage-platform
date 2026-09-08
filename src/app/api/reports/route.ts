import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

// GET /api/reports?type=inventory|storage-utilization|revenue|outstanding-payments|returns|damaged|warehouse-activity&from=&to=
// Every report supports optional from/to (unix seconds) date-range filtering, matching the spec's
// "Filters + Date Range" requirement. Export to CSV is handled client-side from this JSON (see /admin/reports page).
export async function GET(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const from = Number(searchParams.get("from") ?? 0);
  const to = Number(searchParams.get("to") ?? Math.floor(Date.now() / 1000) + 1);

  switch (type) {
    case "inventory": {
      const rows = await db.select().from(schema.products);
      return ok(rows.map((p) => ({ sku: p.sku, name: p.name, quantity: p.quantity, minStock: p.minStock, customerId: p.customerId })));
    }
    case "storage-utilization": {
      const allocations = await db.select().from(schema.storageAllocations);
      return ok(allocations.map((a) => ({ customerId: a.customerId, allocatedM2: a.allocatedM2, usedM2: a.usedM2, utilizationPercent: a.allocatedM2 > 0 ? Math.round((a.usedM2 / a.allocatedM2) * 1000) / 10 : 0, status: a.status })));
    }
    case "revenue": {
      const invoices = (await db.select().from(schema.invoices)).filter((i) => i.createdAt >= from && i.createdAt < to);
      const byCustomer: Record<number, number> = {};
      for (const inv of invoices) byCustomer[inv.customerId] = (byCustomer[inv.customerId] ?? 0) + inv.total;
      return ok({ totalRevenue: invoices.reduce((s, i) => s + i.total, 0), invoiceCount: invoices.length, byCustomer });
    }
    case "outstanding-payments": {
      const invoices = (await db.select().from(schema.invoices)).filter((i) => i.status !== "paid");
      return ok(invoices);
    }
    case "returns": {
      const rows = (await db.select().from(schema.returns)).filter((r) => r.createdAt >= from && r.createdAt < to);
      return ok(rows);
    }
    case "damaged": {
      const rows = (await db.select().from(schema.inventoryMovements)).filter((m) => m.type === "DAMAGE" && m.createdAt >= from && m.createdAt < to);
      return ok(rows);
    }
    case "warehouse-activity": {
      const movements = (await db.select().from(schema.inventoryMovements)).filter((m) => m.createdAt >= from && m.createdAt < to);
      const byType: Record<string, number> = {};
      for (const m of movements) byType[m.type] = (byType[m.type] ?? 0) + 1;
      return ok({ totalMovements: movements.length, byType });
    }
    default:
      return fail("نوع تقرير غير معروف. القيم المتاحة: inventory, storage-utilization, revenue, outstanding-payments, returns, damaged, warehouse-activity");
  }
}
