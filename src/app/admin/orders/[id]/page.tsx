import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shell";
import { StatusPill } from "@/components/ui";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) notFound();

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, order.customerId));

  return (
    <div>
      <PageHeader
        title={`طلب رقم ${order.orderNumber}`}
        description={customer?.companyName ?? "—"}
      />
      <div className="grid gap-4 mt-4">
        <div className="flex gap-4">
          <StatusPill status={order.status} label={order.status} />
          <StatusPill status={order.paymentStatus} label={order.paymentStatus} />
        </div>
        <div className="text-sm text-muted">
          تاريخ الطلب: {new Date(order.createdAt * 1000).toLocaleDateString("ar-EG")}
        </div>
      </div>
    </div>
  );
}