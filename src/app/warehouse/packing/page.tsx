import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/shell";
import { PackingStation } from "./packing-station";

export default async function WarehousePackingPage() {
  const readyOrders = await db.select().from(schema.orders).where(eq(schema.orders.status, "picked"));
  const customers = await db.select().from(schema.customers);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  const orders = readyOrders.map((o) => ({ id: o.id, orderNumber: o.orderNumber, customerName: customerById.get(o.customerId)?.companyName ?? "—" }));

  return (
    <div>
      <PageHeader title="التغليف (Packing)" description={`${orders.length} طلب جاهز للتغليف`} />
      <PackingStation initialOrders={orders} />
    </div>
  );
}
