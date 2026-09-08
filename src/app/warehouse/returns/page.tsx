import { db, schema } from "@/db";
import { ne, eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/shell";
import { ReturnsQueue } from "./returns-queue";

export default async function WarehouseReturnsPage() {
  const open = await db.select().from(schema.returns).where(ne(schema.returns.status, "processed"));
  const customers = await db.select().from(schema.customers);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const items = await Promise.all(open.map((r) => db.select().from(schema.returnItems).where(eq(schema.returnItems.returnId, r.id))));
  const products = await db.select().from(schema.products);
  const productById = new Map(products.map((p) => [p.id, p]));

  const returns = open.map((r, i) => ({
    id: r.id,
    returnNumber: r.returnNumber,
    customerName: customerById.get(r.customerId)?.companyName ?? "—",
    reason: r.reason,
    status: r.status,
    items: items[i].map((it) => ({ name: productById.get(it.productId)?.name ?? "—", quantity: it.quantity })),
  }));

  return (
    <div>
      <PageHeader title="المرتجعات" description={`${returns.length} مرتجع قيد المعالجة`} />
      <ReturnsQueue initialReturns={returns} />
    </div>
  );
}