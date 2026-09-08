import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { PageHeader } from "@/components/dashboard/shell";
import { Calculator } from "./calculator";

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-5 py-16 w-full">
        <PageHeader title="احسب تكلفة التخزين" description="حدد احتياجك واحصل على تقدير شهري فوري — الأسعار مبنية على إعدادات التسعير الحالية وقابلة للتفاوض حسب حجمك" />
        <Calculator />
      </main>
      <SiteFooter />
    </>
  );
}
