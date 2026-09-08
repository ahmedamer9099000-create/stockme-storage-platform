import { db, schema } from "@/db";
import { PageHeader } from "@/components/dashboard/shell";
import { HandoffsView } from "./handoffs-view";

export default async function WarehouseHandoffsPage() {
  const [customers, warehouses, handoffs] = await Promise.all([
    db.select().from(schema.customers),
    db.select().from(schema.warehouses),
    db.select().from(schema.cartonHandoffs),
  ]);

  return (
    <div>
      <PageHeader title="تسليم كراتين" description="سجّل تسليم كراتين جاهزة من مخزون العميل مباشرة لمندوب الشحن" />
      <HandoffsView
        customers={customers}
        warehouses={warehouses}
        initialHandoffs={[...handoffs].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)}
      />
    </div>
  );
}