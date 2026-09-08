import { ContentPage } from "@/components/site/content-page";
import { Card } from "@/components/ui";

const features = [
  { title: "لوحة تحكم لحظية", body: "شوف مخزونك ومساحتك وطلباتك وفواتيرك من مكان واحد، بتحديث فوري مع كل حركة." },
  { title: "سجل حركة مخزون كامل", body: "كل دخول أو خروج أو تعديل أو تلف مسجَّل بتاريخه ومين اللي عمله — شفافية كاملة." },
  { title: "مواقع دقيقة للمنتجات", body: "كل منتج له موقع محدد (مخزن → منطقة → رف → شلف → صندوق) — مفيش وقت ضايع في البحث." },
  { title: "تسعير مرن وشفاف", body: "تدفع حسب المساحة والخدمات اللي بتستخدمها فعلاً، مفيش رسوم مخفية." },
  { title: "إشعارات فورية", body: "استلام بضاعة، تحديث مخزون، تجهيز طلب، شحن، فاتورة مستحقة — كله بإشعار فوري." },
  { title: "تقارير جاهزة للتصدير", body: "تقارير المخزون، الإشغال، الإيرادات، والمرتجعات — قابلة للتصدير CSV في أي وقت." },
];

export default function FeaturesPage() {
  return (
    <ContentPage title="المميزات" description="كل اللي محتاجه عشان تدير تخزين بضاعتك من غير تعقيد">
      <div className="grid sm:grid-cols-2 gap-5">
        {features.map((f) => (
          <Card key={f.title} className="bg-surface p-5">
            <p className="font-display font-semibold mb-1.5">{f.title}</p>
            <p className="text-sm text-muted leading-relaxed">{f.body}</p>
          </Card>
        ))}
      </div>
    </ContentPage>
  );
}
