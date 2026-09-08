import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getFreshUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shell";
import { InventoryTable } from "./inventory-table";

export default async function CustomerInventoryPage() {
  const user = await getFreshUser();
  if (!user?.customerId) redirect("/login");

  const products = await db.select().from(schema.products).where(eq(schema.products.customerId, user.customerId));

  return (
    <div>
      <PageHeader title="مخزوني" description="أضف منتجات جديدة وتابع الكميات — كل حركة مسجَّلة في سجل حركة المخزون" />
      <InventoryTable initialProducts={products} />
    </div>
  );
}
