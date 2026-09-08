import { db, schema } from "@/db";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { ConfirmPaymentButton } from "./confirm-payment-button";

const methodLabels: Record<string, string> = {
  cod: "الدفع عند الاستلام (كاش)",
  online: "دفع إلكتروني",
  instapay: "إنستاباي",
};

export default async function WarehousePaymentsPage() {
  const [orders, customers] = await Promise.all([
    db.select().from(schema.orders),
    db.select().from(schema.customers),
  ]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const pending = orders
    .filter((o) => o.paymentStatus === "pending" && o.status !== "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <PageHeader title="المدفوعات" description={`${pending.length} طلب بانتظار تأكيد الدفع`} />
      <DataTable headers={["رقم الطلب", "العميل", "طريقة الدفع", "إثبات الدفع", "إجراء"]}>
        {pending.map((o) => (
          <tr key={o.id}>
            <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
            <td className="px-4 py-3">{customerById.get(o.customerId)?.companyName ?? "—"}</td>
            <td className="px-4 py-3">{methodLabels[o.paymentMethod] ?? o.paymentMethod}</td>
            <td className="px-4 py-3">
              {o.paymentProofUrl ? (
                <a href={o.paymentProofUrl} target="_blank" rel="noreferrer">
                  <img
                    src={o.paymentProofUrl}
                    alt="إثبات الدفع"
                    className="h-12 w-12 object-cover rounded border border-line hover:opacity-80"
                  />
                </a>
              ) : (
                <span className="text-muted text-xs">—</span>
              )}
            </td>
            <td className="px-4 py-3">
              <ConfirmPaymentButton orderId={o.id} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
