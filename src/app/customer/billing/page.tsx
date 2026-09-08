import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getFreshUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shell";
import { Card, StatusPill, EmptyState } from "@/components/ui";

export default async function CustomerBillingPage() {
  const user = await getFreshUser();
  if (!user?.customerId) redirect("/login");

  const invoices = await db.select().from(schema.invoices).where(eq(schema.invoices.customerId, user.customerId));
  const sorted = [...invoices].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);

  const items = await Promise.all(sorted.map((inv) => db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, inv.id))));

  return (
    <div>
      <PageHeader title="الفواتير والمدفوعات" description="فواتيرك الشهرية وتفاصيل كل رسم" />
      {sorted.length === 0 ? (
        <EmptyState title="لا توجد فواتير بعد" />
      ) : (
        <div className="space-y-4">
          {sorted.map((inv, i) => (
            <Card key={inv.id} className="bg-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-muted">{inv.invoiceNumber}</p>
                  <p className="font-display font-bold text-lg">{inv.total.toLocaleString()} EGP</p>
                </div>
                <StatusPill
                  status={inv.status}
                  label={inv.status === "paid" ? "مدفوعة" : inv.status === "overdue" ? "متأخرة" : inv.status === "partially_paid" ? "مدفوعة جزئيًا" : "معلَّقة"}
                />
              </div>
              <div className="border-t border-line pt-3 space-y-1.5">
                {items[i].map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted">{item.description}</span>
                    <span>{item.amount.toLocaleString()} EGP</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1.5 border-t border-line-soft">
                  <span className="text-muted">ضريبة القيمة المضافة ({inv.taxRate}%)</span>
                  <span>{inv.taxAmount.toLocaleString()} EGP</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
