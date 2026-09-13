import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getFreshUser } from "@/lib/auth";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";
import { SuspendToggle } from "./suspend-toggle";
import { CustomerDeleteButton } from "./customer-delete-button";
import { ApproveStorageForm } from "./approve-storage-form";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = Number(id);
  const [user, customerRow] = await Promise.all([
    getFreshUser(),
    db.select().from(schema.customers).where(eq(schema.customers.id, customerId)),
  ]);
  const [customer] = customerRow;
  if (!customer) notFound();

  const [products, orders, invoices, allocations] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.customerId, customerId)),
    db.select().from(schema.orders).where(eq(schema.orders.customerId, customerId)),
    db.select().from(schema.invoices).where(eq(schema.invoices.customerId, customerId)),
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, customerId)),
  ]);

  const activeAllocations = allocations.filter((a) => a.status === "active");
  const approvalLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "بانتظار الموافقة", className: "bg-warning-bg text-warning" },
    approved: { label: "معتمدة", className: "bg-success-bg text-success" },
    rejected: { label: "مرفوضة", className: "bg-danger-bg text-danger" },
  };

  return (
    <div>
      <PageHeader
        title={customer.companyName}
        description={`${customer.businessType ?? ""} — ${customer.phone ?? "بدون رقم هاتف"}`}
        action={
          <div className="flex items-center gap-2">
            <SuspendToggle customerId={customer.id} status={customer.status} />
            {user?.role === "SUPER_ADMIN" && (
              <CustomerDeleteButton customerId={customer.id} companyName={customer.companyName} />
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-line rounded-xl p-4">
          <p className="text-xs text-muted mb-1">المساحة</p>
          {activeAllocations.map((a) => {
            const hasPendingRenewal = a.pendingRenewalMonths != null;
            const daysLeft = a.endDate ? Math.ceil((a.endDate - Math.floor(Date.now() / 1000)) / 86400) : null;
            return (
              <div key={a.id} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-lg">
                    {a.usedM2} / {a.allocatedM2} م²
                  </p>
                  <span className={`pill text-xs ${approvalLabels[a.approvalStatus].className}`}>{approvalLabels[a.approvalStatus].label}</span>
                  {hasPendingRenewal && (
                    <span className="pill text-xs bg-warning-bg text-warning">طلب تجديد ({a.pendingRenewalMonths} شهر)</span>
                  )}
                </div>
                {a.endDate && (
                  <p className={`text-xs mt-1 ${daysLeft !== null && daysLeft <= 7 ? "text-danger font-medium" : "text-muted"}`}>
                    ينتهي في: {new Date(a.endDate * 1000).toLocaleDateString("ar-EG")}
                    {daysLeft !== null && daysLeft <= 7 && (daysLeft >= 0 ? ` (باقي ${daysLeft} يوم)` : " (انتهت المدة)")}
                  </p>
                )}
                {(a.approvalStatus === "pending" || hasPendingRenewal) && <ApproveStorageForm allocationId={a.id} />}
              </div>
            );
          })}
          {activeAllocations.length === 0 && <p className="text-sm text-muted">لا توجد مساحة مخصصة</p>}
        </div>
        <div className="bg-surface border border-line rounded-xl p-4">
          <p className="text-xs text-muted mb-1">عدد المنتجات</p>
          <p className="font-display font-bold text-lg">{products.length}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4">
          <p className="text-xs text-muted mb-1">إجمالي الطلبات</p>
          <p className="font-display font-bold text-lg">{orders.length}</p>
        </div>
      </div>

      <p className="font-display font-semibold mb-3">المخزون</p>
      <DataTable headers={["SKU", "المنتج", "الكمية", "الحد الأدنى"]}>
        {products.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
            <td className="px-4 py-3">{p.name}</td>
            <td className="px-4 py-3">{p.quantity}</td>
            <td className="px-4 py-3 text-muted">{p.minStock}</td>
          </tr>
        ))}
        {products.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">لا توجد منتجات</td>
          </tr>
        )}
      </DataTable>

      <p className="font-display font-semibold mb-3 mt-8">الطلبات</p>
      <DataTable headers={["رقم الطلب", "الحالة", "حالة الدفع", "التاريخ"]}>
        {orders.map((o) => (
          <tr key={o.id}>
            <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
            <td className="px-4 py-3"><StatusPill status={o.status} /></td>
            <td className="px-4 py-3"><StatusPill status={o.paymentStatus} /></td>
            <td className="px-4 py-3 text-muted text-xs">{new Date(o.createdAt * 1000).toLocaleDateString("ar-EG")}</td>
          </tr>
        ))}
        {orders.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">لا توجد طلبات</td>
          </tr>
        )}
      </DataTable>

      <p className="font-display font-semibold mb-3 mt-8">الفواتير</p>
      <DataTable headers={["رقم الفاتورة", "الإجمالي", "الحالة", "تاريخ الاستحقاق"]}>
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
            <td className="px-4 py-3">{inv.total.toLocaleString()} EGP</td>
            <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
            <td className="px-4 py-3 text-muted text-xs">{inv.dueDate ? new Date(inv.dueDate * 1000).toLocaleDateString("ar-EG") : "—"}</td>
          </tr>
        ))}
        {invoices.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">لا توجد فواتير</td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}