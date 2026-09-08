import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getFreshUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shell";
import { OrdersView } from "./orders-view";

export default async function CustomerOrdersPage() {
  const user = await getFreshUser();
  if (!user?.customerId) redirect("/login");

  const [orders, products] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.customerId, user.customerId)),
    db.select().from(schema.products).where(eq(schema.products.customerId, user.customerId)),
  ]);

  return (
    <div>
      <PageHeader title="الطلبات" description="اطلب إخراج بضاعة من مخزونك ليتم تجهيزها وشحنها" />
      <OrdersView initialOrders={[...orders].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)} products={products} />
    </div>
  );
}
