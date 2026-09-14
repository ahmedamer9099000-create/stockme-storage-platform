import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/shell";
import { ClearanceQueue } from "./clearance-queue";

export default async function WarehouseStorageClearancePage() {
  const pending = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.clearanceStatus, "pending"));
  const customers = await db.select().from(schema.customers);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const warehouses = await db.select().from(schema.warehouses);
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  const allocations = pending.map((a) => ({
    id: a.id,
    customerName: customerById.get(a.customerId)?.companyName ?? "—",
    warehouseName: warehouseById.get(a.warehouseId)?.name ?? "—",
    allocatedM2: a.allocatedM2,
  }));

  return (
    <div>
      <PageHeader title="إخلاء المساحات المنتهية" description={`${allocations.length} مساحة بانتظار تأكيد الإخلاء`} />
      <ClearanceQueue initialAllocations={allocations} />
    </div>
  );
}