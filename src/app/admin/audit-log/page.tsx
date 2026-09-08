import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { PageHeader, DataTable } from "@/components/dashboard/shell";

const actionLabels: Record<string, string> = {
  customer_updated: "تعديل بيانات عميل",
  customer_deleted: "حذف عميل",
  product_approved: "اعتماد منتج",
  product_rejected: "رفض منتج",
  storage_approved: "الموافقة على حجز مساحة",
  storage_rejected: "رفض طلب حجز مساحة",
};

export default async function AdminAuditLogPage() {
  const [logs, users] = await Promise.all([
    db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(200),
    db.select().from(schema.users),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader title="سجل التدقيق" description="آخر 200 عملية حساسة تمت في النظام" />
      <DataTable headers={["التاريخ", "المستخدم", "العملية", "النوع", "التفاصيل"]}>
        {logs.map((log) => (
          <tr key={log.id}>
            <td className="px-4 py-3 text-muted text-xs">{new Date(log.createdAt * 1000).toLocaleString("ar-EG")}</td>
            <td className="px-4 py-3 text-sm">{log.userId ? userById.get(log.userId)?.name ?? `#${log.userId}` : "—"}</td>
            <td className="px-4 py-3 text-sm">{actionLabels[log.action] ?? log.action}</td>
            <td className="px-4 py-3 text-muted text-xs">{log.entityType} {log.entityId ? `#${log.entityId}` : ""}</td>
            <td className="px-4 py-3 text-xs text-muted max-w-xs truncate" title={log.details ?? ""}>{log.details ?? "—"}</td>
          </tr>
        ))}
        {logs.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">لا توجد عمليات مسجَّلة بعد</td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}