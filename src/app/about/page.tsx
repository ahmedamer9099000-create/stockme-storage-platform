import { ContentPage } from "@/components/site/content-page";
import { Card } from "@/components/ui";

export default function AboutPage() {
  return (
    <ContentPage title="من نحن" description="مساحة هي منصة تخزين مرن وخدمات تجهيز وشحن لأصحاب المتاجر الإلكترونية والتجار في مصر">
      <div className="space-y-5 text-ink/80 leading-relaxed">
        <p>
          بدأت فكرة مساحة من مشكلة بسيطة: تاجر بيبيع أونلاين وبضاعته كبرت، ومحتاج مكان يخزنها فيه من غير ما يلتزم بعقد سنة كاملة أو مساحة أكبر من احتياجه.
        </p>
        <p>
          بدل ما تستأجر مخزن كامل، مساحة بتخليك تدفع بس على اللي بتستخدمه فعلاً — وتقدر تكبر أو تقلل مساحتك شهر بشهر حسب حجم بضاعتك.
        </p>
        <p>
          ومع الوقت، بنتوسع من مجرد تخزين لخدمة تجهيز وشحن متكاملة (Fulfillment)، عشان نبقى شريكك في كل حاجة من التخزين لحد ما الطلب يوصل لعميلك.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {[
          ["24 ساعة", "بدء التخزين من لحظة الحجز"],
          ["5-100م²", "مرونة كاملة في المساحة"],
          ["Hybrid", "تسعير عادل حسب الاستخدام"],
        ].map(([big, small]) => (
          <Card key={big} className="bg-surface p-5 text-center">
            <p className="font-display font-bold text-2xl text-brand-dark">{big}</p>
            <p className="text-xs text-muted mt-1">{small}</p>
          </Card>
        ))}
      </div>
    </ContentPage>
  );
}
