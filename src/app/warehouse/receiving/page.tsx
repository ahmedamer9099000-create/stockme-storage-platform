import { db, schema } from "@/db";
import { PageHeader } from "@/components/dashboard/shell";
import { ReceivingView } from "./receiving-view";

export default async function WarehouseReceivingPage() {
  const [receivingOrders, customers, products, warehouses, items, bins] = await Promise.all([
    db.select().from(schema.receivingOrders),
    db.select().from(schema.customers),
    db.select().from(schema.products),
    db.select().from(schema.warehouses),
    db.select().from(schema.receivingItems),
    db.select().from(schema.bins),
  ]);
  return (
    <div>
      <PageHeader title="الاستلام" description="سجّل بضاعة واردة، تابع أكواد الكميات الفعلية لتحديث المخزون تلقائيًا" />
      <ReceivingView
        initialOrders={[...receivingOrders].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)}
        customers={customers}
        products={products}
        warehouses={warehouses}
        allItems={items}
        bins={bins}
      />
    </div>
  );
}