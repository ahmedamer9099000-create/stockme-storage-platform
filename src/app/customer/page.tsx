import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getFreshUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader, StatCard, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";

export default async function CustomerOverviewPage() {
  const user = await getFreshUser();
  if (!user?.customerId) redirect("/login");

  const [products, orders, returnsRows, invoices, allocations] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.customerId, user.customerId)),
    db.select().from(schema.orders).where(eq(schema.orders.customerId, user.customerId)),
    db.select().from(schema.returns).where(eq(schema.returns.customerId, user.customerId)),
    db.select().from(schema.invoices).where(eq(schema.invoices.customerId, user.customerId)),
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, user.customerId)),
  ]);

  const allocation = allocations.find((a) => a.status === "active");
  const totalQuantity = products.reduce((s, p) => s + p.quantity, 0);
  const outstanding = invoices.filter((i) => i.status !== "paid");
  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).slice(0, 5);

  return (
    <div>
      <PageHeader title="نظرة عامة" description="حالة مخزونك وطلباتك لحظيًا" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="عدد المنتجات" value={products.length} sub={`${totalQuantity} قطعة إجمالاً`} />
        <StatCard label="المساحة المستخدمة" value={allocation ? `${allocation.usedM2} م²` : "—"} sub={allocation ? `من أصل ${allocation.allocatedM2} م²` : "لا توجد مساحة مخصصة بعد"} />
        <StatCard label="الطلبات الحالية" value={orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length} sub={`${orders.filter((o) => o.status === "delivered").length} طلب مكتمل`} />
        <StatCard label="فواتير مستحقة" value={outstanding.length} sub={`${outstanding.reduce((s, i) => s + i.total, 0).toLocaleString()} EGP`} />
      </div>

      <p className="font-display font-semibold mb-3">أحدث الطلبات</p>
      <DataTable headers={["رقم الطلب", "الحالة", "حالة الدفع"]}>
        {recentOrders.map((o) => (
          <tr key={o.id}>
            <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
            <td className="px-4 py-3"><StatusPill status={o.status} /></td>
            <td className="px-4 py-3"><StatusPill status={o.paymentStatus} /></td>
          </tr>
        ))}
        {recentOrders.length === 0 && (
          <tr>
            <td colSpan={3} className="px-4 py-8 text-center text-muted text-sm">لسه معملتش أي طلب</td>
          </tr>
        )}
      </DataTable>

      {returnsRows.length > 0 && (
        <>
          <p className="font-display font-semibold mb-3 mt-8">المرتجعات</p>
          <DataTable headers={["رقم المرتجع", "السبب", "الحالة"]}>
            {returnsRows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.returnNumber}</td>
                <td className="px-4 py-3 text-muted">{r.reason}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </div>
  );
}
