import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader, StatCard, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";
import Link from "next/link";

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

export default async function AdminOverviewPage() {
  const [customers, allocations, warehouses, orders, products, invoicesRows] = await Promise.all([
    db.select().from(schema.customers),
    db.select().from(schema.storageAllocations),
    db.select().from(schema.warehouses),
    db.select().from(schema.orders),
    db.select().from(schema.products),
    db.select().from(schema.invoices),
  ]);

  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalCapacity = warehouses.reduce((s, w) => s + w.totalCapacityM2, 0);
  const occupied = allocations.filter((a) => a.status === "active").reduce((s, a) => s + a.allocatedM2, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 1000) / 10 : 0;

  const todayStart = startOfTodayUnix();
  const monthStart = startOfMonthUnix();
  const ordersToday = orders.filter((o) => o.createdAt >= todayStart).length;
  const ordersThisMonth = orders.filter((o) => o.createdAt >= monthStart).length;
  const monthlyRevenue = invoicesRows.filter((i) => i.createdAt >= monthStart).reduce((s, i) => s + i.total, 0);
  const pendingPayments = invoicesRows.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const lowStock = products.filter((p) => p.quantity <= p.minStock);

  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).slice(0, 6);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader title="نظرة عامة" description="أهم أرقام النظام لحظيًا" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي العملاء" value={customers.length} sub={`${activeCustomers} نشط`} />
        <StatCard label="نسبة الإشغال" value={`${occupancyPercent}%`} sub={`${occupied} من ${totalCapacity} م²`} />
        <StatCard label="إيراد هذا الشهر" value={`${monthlyRevenue.toLocaleString()} EGP`} />
        <StatCard label="مدفوعات مستحقة" value={`${pendingPayments.toLocaleString()} EGP`} />
        <StatCard label="طلبات اليوم" value={ordersToday} />
        <StatCard label="طلبات هذا الشهر" value={ordersThisMonth} />
        <StatCard label="المرتجعات" value={(await db.select().from(schema.returns)).length} />
        <StatCard label="مخزون منخفض" value={lowStock.length} sub={lowStock.length > 0 ? "يحتاج مراجعة" : "كل شيء طبيعي"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <p className="font-display font-semibold mb-3">أحدث الطلبات</p>
          <DataTable headers={["رقم الطلب", "العميل", "الحالة"]}>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/orders/${o.id}`} className="text-brand hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{customerById.get(o.customerId)?.companyName ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </div>

        <div>
          <p className="font-display font-semibold mb-3">مخزون منخفض</p>
          <DataTable headers={["SKU", "المنتج", "الكمية", "الحد الأدنى"]}>
            {lowStock.slice(0, 6).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-danger font-medium">{p.quantity}</td>
                <td className="px-4 py-3 text-muted">{p.minStock}</td>
              </tr>
            ))}
            {lowStock.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">
                  لا يوجد مخزون منخفض حاليًا
                </td>
              </tr>
            )}
          </DataTable>
        </div>
      </div>
    </div>
  );
}
