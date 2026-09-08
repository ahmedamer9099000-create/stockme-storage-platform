import { db, schema } from "@/db";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { LeadStatusSelect } from "./status-select";

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهَّل",
  proposal_sent: "تم إرسال عرض",
  won: "تم الإغلاق",
  lost: "خسارة",
};

export default async function AdminLeadsPage() {
  const leads = await db.select().from(schema.leads);
  const sorted = [...leads].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);

  return (
    <div>
      <PageHeader title="العملاء المحتملون" description={`${leads.length} عميل محتمل — من نموذج الحجز في الصفحة الرئيسية`} />
      <DataTable headers={["الاسم", "الهاتف", "نوع النشاط", "المساحة المطلوبة", "الحالة"]}>
        {sorted.map((l) => (
          <tr key={l.id}>
            <td className="px-4 py-3 font-medium">{l.name}</td>
            <td className="px-4 py-3 font-mono text-xs">{l.phone}</td>
            <td className="px-4 py-3 text-muted">{l.businessType ?? "—"}</td>
            <td className="px-4 py-3">{l.requiredSpaceM2 ? `${l.requiredSpaceM2} م²` : "—"}</td>
            <td className="px-4 py-3">
              <LeadStatusSelect leadId={l.id} status={l.status} labels={statusLabels} />
            </td>
          </tr>
        ))}
        {leads.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">لا يوجد عملاء محتملون بعد</td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}
