import { db, schema } from "@/db";
import { getFreshUser } from "@/lib/auth";
import { PageHeader, DataTable } from "@/components/dashboard/shell";
import { ProductApprovalActions } from "./approval-actions";
import { ProductDeleteButton } from "./product-delete-button";

const approvalLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "بانتظار الموافقة", className: "bg-warning-bg text-warning" },
  approved: { label: "معتمد", className: "bg-success-bg text-success" },
  rejected: { label: "مرفوض", className: "bg-danger-bg text-danger" },
};

export default async function AdminProductsPage() {
  const user = await getFreshUser();
  const [products, customers, bins, shelves, racks, zones, warehouses] = await Promise.all([
    db.select().from(schema.products),
    db.select().from(schema.customers),
    db.select().from(schema.bins),
    db.select().from(schema.shelves),
    db.select().from(schema.racks),
    db.select().from(schema.zones),
    db.select().from(schema.warehouses),
  ]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const binById = new Map(bins.map((b) => [b.id, b]));
  const shelfById = new Map(shelves.map((s) => [s.id, s]));
  const rackById = new Map(racks.map((r) => [r.id, r]));
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  function fullLocation(binId: number | null) {
    if (!binId) return null;
    const bin = binById.get(binId);
    if (!bin) return null;
    const shelf = shelfById.get(bin.shelfId);
    const rack = shelf ? rackById.get(shelf.rackId) : undefined;
    const zone = rack ? zoneById.get(rack.zoneId) : undefined;
    const warehouse = zone ? warehouseById.get(zone.warehouseId) : undefined;
    return [warehouse?.code, zone?.code, rack?.code, shelf?.code, bin.code].filter(Boolean).join(" / ");
  }

  const pending = products.filter((p) => p.approvalStatus === "pending");

  return (
    <div>
      <PageHeader title="المنتجات والمخزون" description={`${products.length} منتج عبر كل العملاء`} />

      {isSuperAdmin && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-sm font-bold mb-3">منتجات بانتظار الموافقة ({pending.length})</h2>
          <DataTable headers={["SKU", "المنتج", "العميل", "الكمية المطلوبة", "المساحة (م²)", "القرار"]}>
            {pending.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-muted">{customerById.get(p.customerId)?.companyName ?? "—"}</td>
                <td className="px-4 py-3">{p.requestedInitialQty ?? 0}</td>
                <td className="px-4 py-3">{p.spaceM2} م²</td>
                <td className="px-4 py-3">
                  <ProductApprovalActions productId={p.id} />
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      <DataTable headers={["SKU", "المنتج", "العميل", "الكمية", "متاح", "محجوز", "الموقع الكامل", "حالة الموافقة", ""]}>
        {products.map((p) => {
          const low = p.quantity <= p.minStock;
          const available = Math.max(p.quantity - p.reservedQty, 0);
          const location = fullLocation(p.binId);
          const approval = approvalLabels[p.approvalStatus] ?? approvalLabels.approved;
          return (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
              <td className="px-4 py-3">{p.name}</td>
              <td className="px-4 py-3 text-muted">{customerById.get(p.customerId)?.companyName ?? "—"}</td>
              <td className={`px-4 py-3 font-medium ${low ? "text-danger" : ""}`}>{p.quantity}</td>
              <td className="px-4 py-3">{available}</td>
              <td className="px-4 py-3 text-muted">{p.reservedQty}</td>
              <td className="px-4 py-3 text-xs text-muted">{location ?? "لم يُحدَّد موقع"}</td>
              <td className="px-4 py-3">
                <span className={`pill ${approval.className}`}>{approval.label}</span>
                {p.approvalStatus === "rejected" && p.rejectionReason && <p className="text-xs text-muted mt-1">{p.rejectionReason}</p>}
              </td>
              <td className="px-4 py-3">
                {isSuperAdmin && <ProductDeleteButton productId={p.id} productName={p.name} />}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}