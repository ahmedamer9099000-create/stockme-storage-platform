import { db, schema } from "@/db";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { WarehouseForm } from "./warehouse-form";
import { WarehouseDeleteButton } from "./warehouse-delete-button";

export default async function AdminWarehousesPage() {
  const warehouses = await db.select().from(schema.warehouses);

  return (
    <div>
      <PageHeader
        title="المخازن"
        description="المخازن المتاحة تظهر تلقائيًا للتجار عند حجز مساحة تخزين"
      />

      <WarehouseForm />

      <div className="mt-6">
        {warehouses.length === 0 ? (
          <p className="text-muted text-sm">لا يوجد مخازن مضافة حتى الآن.</p>
        ) : (
          <DataTable headers={["الاسم", "الكود", "العنوان", "السعة الكلية (م²)", ""]}>
            {warehouses.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 text-muted">{w.code}</td>
                <td className="px-4 py-3 text-muted">{w.address ?? "—"}</td>
                <td className="px-4 py-3">{w.totalCapacityM2.toLocaleString()} م²</td>
                <td className="px-4 py-3">
                  <WarehouseDeleteButton warehouseId={w.id} warehouseName={w.name} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
