import { db, schema } from "@/db";
import { PageHeader, StatCard } from "@/components/dashboard/shell";

function startOfTodayUnix() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export default async function WarehouseTodayPage() {
  const todayStart = startOfTodayUnix();
  const [receiving, picking, packing, shipments, returnsRows] = await Promise.all([
    db.select().from(schema.receivingOrders),
    db.select().from(schema.pickingTasks),
    db.select().from(schema.packingTasks),
    db.select().from(schema.shipments),
    db.select().from(schema.returns),
  ]);
  return (
    <div>
      <PageHeader title="لوحة اليوم" description="مهامك ومهام الفريق لهذا اليوم" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="استلام اليوم" value={receiving.filter((r) => r.createdAt >= todayStart).length} sub={`${receiving.filter((r) => r.status === "pending").length} بانتظار التأكيد`} />
        <StatCard label="تجهيز اليوم" value={picking.filter((p) => p.createdAt >= todayStart).length} sub={`${picking.filter((p) => p.status === "pending").length} معلَّق`} />
        <StatCard label="تغليف اليوم" value={packing.filter((p) => p.createdAt >= todayStart).length} sub={`${packing.filter((p) => p.status === "pending").length} معلَّق`} />
        <StatCard label="شحن اليوم" value={shipments.filter((s) => (s.shippedAt ?? 0) >= todayStart).length} />
        <StatCard label="مرتجعات اليوم" value={returnsRows.filter((r) => r.createdAt >= todayStart).length} sub={`${returnsRows.filter((r) => r.status !== "processed").length} بانتظار المعالجة`} />
        <StatCard label="إجمالي المهام المعلَّقة" value={picking.filter((p) => p.status === "pending").length + packing.filter((p) => p.status === "pending").length} />
      </div>
    </div>
  );
}