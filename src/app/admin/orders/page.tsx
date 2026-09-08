import { db, schema } from "@/db";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";
import { OrderActions } from "./order-actions";

const statusLabels: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  picking: "قيد التجهيز",
  picked: "تم التجهيز",
  packing: "قيد التغليف",
  packed: "تم التغليف",
  ready_for_shipping: "جاهز للشحن",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مرتجع",
};

export default async function AdminOrdersPage() {
  const [orders, customers] = await Promise.all([db.select().from(schema.orders), db.select().from(schema.customers)]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);

  return (
    <div>
      <PageHeader title="الطلبات" description={`${orders.length} طلب إجمالاً — تأكيد الطلب ينشئ مهام التجهيز تلقائيًا لموظفي المخزن`} />
      <DataTable headers={["رقم الطلب", "العميل", "الحالة", "حالة الدفع", "التاريخ", "إجراء"]}>
        {sorted.map((o) => (
          <tr key={o.id}>
            <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
            <td className="px-4 py-3">{customerById.get(o.customerId)?.companyName ?? "—"}</td>
            <td className="px-4 py-3">
              <StatusPill status={o.status} label={statusLabels[o.status] ?? o.status} />
            </td>
            <td className="px-4 py-3">
              <StatusPill status={o.paymentStatus} label={o.paymentStatus === "paid" ? "مدفوع" : o.paymentStatus === "pending" ? "معلَّق" : o.paymentStatus === "overdue" ? "متأخر" : "مدفوع جزئيًا"} />
            </td>
            <td className="px-4 py-3 text-muted text-xs">{new Date(o.createdAt * 1000).toLocaleDateString("ar-EG")}</td>
                <td className="px-4 py-3"><OrderActions orderId={o.id} status={o.status} /></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
