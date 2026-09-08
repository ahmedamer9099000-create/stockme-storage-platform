import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/shell";
import { PickingQueue } from "./picking-queue";

export default async function WarehousePickingPage() {
  const pending = await db.select().from(schema.pickingTasks).where(eq(schema.pickingTasks.status, "pending"));

  const enriched = await Promise.all(
    pending.map(async (t) => {
      const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, t.orderItemId));
      const [product] = item ? await db.select().from(schema.products).where(eq(schema.products.id, item.productId)) : [null];
      let location: string | null = null;
      if (product?.binId) {
        const [bin] = await db.select().from(schema.bins).where(eq(schema.bins.id, product.binId));
        location = bin?.code ?? null;
      }
      return { id: t.id, orderId: t.orderId, requestedQty: item?.quantity ?? 0, productName: product?.name ?? "—", productSku: product?.sku ?? "—", location };
    })
  );

  return (
    <div>
      <PageHeader title="التجهيز (Picking)" description={`${enriched.length} مهمة تجهيز معلَّقة`} />
      <PickingQueue initialTasks={enriched} />
    </div>
  );
}
