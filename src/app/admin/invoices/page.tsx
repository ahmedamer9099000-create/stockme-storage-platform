import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";
import { GenerateInvoiceForm } from "./generate-form";
import { RecordPaymentForm } from "./record-payment-form";

export default async function AdminInvoicesPage() {
  const [invoices, customers, allPayments] = await Promise.all([
    db.select().from(schema.invoices),
    db.select().from(schema.customers),
    db.select().from(schema.payments),
  ]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const paidByInvoice = new Map<number, number>();
  for (const p of allPayments) {
    if (p.status !== "completed") continue;
    paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amount);
  }
  const sorted = [...invoices].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);

  return (
    <div>
      <PageHeader title="الفواتير" description={`${invoices.length} فاتورة — كل الرسوم مبنية على إعدادات التسعير الحالية`} action={<GenerateInvoiceForm customers={customers} />} />
      <DataTable headers={["رقم الفاتورة", "العميل", "الإجمالي", "المتبقي", "الحالة", "تاريخ الاستحقاق", "دفعة"]}>
        {sorted.map((inv) => {
          const paid = paidByInvoice.get(inv.id) ?? 0;
          const remaining = Math.max(inv.total - paid, 0);
          return (
            <tr key={inv.id}>
              <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
              <td className="px-4 py-3">{customerById.get(inv.customerId)?.companyName ?? "—"}</td>
              <td className="px-4 py-3 font-medium">{inv.total.toLocaleString()} EGP</td>
              <td className="px-4 py-3 text-muted">{remaining > 0 ? `${remaining.toLocaleString()} EGP` : "—"}</td>
              <td className="px-4 py-3">
                <StatusPill status={inv.status} label={inv.status === "paid" ? "مدفوعة" : inv.status === "overdue" ? "متأخرة" : inv.status === "partially_paid" ? "مدفوعة جزئيًا" : "معلَّقة"} />
              </td>
              <td className="px-4 py-3 text-muted text-xs">{inv.dueDate ? new Date(inv.dueDate * 1000).toLocaleDateString("ar-EG") : "—"}</td>
              <td className="px-4 py-3">{remaining > 0 ? <RecordPaymentForm invoiceId={inv.id} remaining={remaining} /> : <span className="text-xs text-success">مكتملة</span>}</td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}