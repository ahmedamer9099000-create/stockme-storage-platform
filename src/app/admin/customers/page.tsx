import { db, schema } from "@/db";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";
import Link from "next/link";

export default async function AdminCustomersPage() {
  const customers = await db.select().from(schema.customers);
  const allocations = await db.select().from(schema.storageAllocations);
  const allocByCustomer = new Map(allocations.filter((a) => a.status === "active").map((a) => [a.customerId, a]));

  return (
    <div>
      <PageHeader title="العملاء" description={`${customers.length} عميل مسجَّل`} />
      <DataTable headers={["اسم المتجر", "نوع النشاط", "الهاتف", "المساحة المؤجرة", "الحالة", ""]}>
        {customers.map((c) => {
          const alloc = allocByCustomer.get(c.id);
          return (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium">{c.companyName}</td>
              <td className="px-4 py-3 text-muted">{c.businessType ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs">{c.phone ?? "—"}</td>
              <td className="px-4 py-3">{alloc ? `${alloc.usedM2}/${alloc.allocatedM2} م²` : "—"}</td>
              <td className="px-4 py-3">
                <StatusPill status={c.status} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/customers/${c.id}`} className="text-brand text-xs font-medium hover:underline">
                  التفاصيل
                </Link>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
