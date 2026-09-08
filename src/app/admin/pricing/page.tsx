import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/shell";
import { PricingForm } from "./pricing-form";

export default async function AdminPricingPage() {
  const [plan] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true));

  return (
    <div>
      <PageHeader title="إعدادات التسعير" description="كل رسوم النظام (الفواتير، آلة حساب التخزين، الباقات) تُحسَب من هذه القيم — ولا يوجد سعر ثابت مكتوب في الكود" />
      {plan ? <PricingForm plan={plan} /> : <p className="text-muted">لا توجد خطة تسعير — شغّل seed أولاً.</p>}
    </div>
  );
}
