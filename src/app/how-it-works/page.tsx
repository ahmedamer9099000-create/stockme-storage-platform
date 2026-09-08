import { ContentPage } from "@/components/site/content-page";
import { Card, Button } from "@/components/ui";

const steps = [
  { title: "1. احجز مساحتك", body: "من الموقع مباشرة، اختر المساحة المناسبة (من 5 لـ100 م²) واحسب تكلفتك التقديرية بآلة الحساب." },
  { title: "2. سلّم بضاعتك", body: "فريقنا يستلم بضاعتك في المخزن، يفحص كل قطعة، ويسجّلها بموقع دقيق (رف/شلف/صندوق)." },
  { title: "3. تابع من لوحة تحكمك", body: "شوف كل منتج وكميته ومكانه، واستقبل إشعارات فورية مع أي حركة تخزين أو تجهيز." },
  { title: "4. اطلب تجهيز الطلبات", body: "لما عميلك يطلب، سجّل الطلب في حسابك — إحنا نتولى التجهيز (Picking) والتغليف (Packing)." },
  { title: "5. الشحن والتسليم", body: "بعد التغليف، بنسلّم الطلب لشركة الشحن المتفَق عليها، وتتابع رقم التتبع من حسابك." },
  { title: "6. الفواتير الشهرية", body: "في نهاية كل شهر، بتوصلك فاتورة مفصَّلة برسوم التخزين والخدمات اللي استخدمتها فعليًا." },
];

export default function HowItWorksPage() {
  return (
    <ContentPage title="كيف تعمل الخدمة؟" description="من حجز المساحة لحد استلام عميلك للشحنة — رحلة واضحة وبسيطة">
      <div className="space-y-4">
        {steps.map((s) => (
          <Card key={s.title} className="bg-surface p-5">
            <p className="font-display font-semibold mb-1.5">{s.title}</p>
            <p className="text-sm text-muted leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-10">
        <Button href="/register">ابدأ الآن</Button>
      </div>
    </ContentPage>
  );
}
