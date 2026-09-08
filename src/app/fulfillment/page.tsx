import { ContentPage } from "@/components/site/content-page";
import { Card, Button } from "@/components/ui";

const workflow = ["Pending", "Confirmed", "Picking", "Picked", "Packing", "Packed", "Ready for Shipping", "Shipped", "Delivered"];

export default function FulfillmentPage() {
  return (
    <ContentPage title="Fulfillment" description="مش مجرد تخزين — إحنا بنستلم طلب عميلك، نجهزه، نغلفه، ونسلمه لشركة الشحن">
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <Card className="bg-surface p-5">
            <p className="font-display font-semibold mb-1.5">Picking</p>
            <p className="text-sm text-muted leading-relaxed">موظف المخزن بيشوف موقع المنتج بالظبط (رف → شلف → صندوق) وبيأكد الالتقاط من التطبيق، وبيتحدث المخزون تلقائيًا.</p>
          </Card>
          <Card className="bg-surface p-5">
            <p className="font-display font-semibold mb-1.5">Packing</p>
            <p className="text-sm text-muted leading-relaxed">بعد التجهيز، الطلب بيدخل محطة التغليف — بيتسجل نوع التغليف والوزن والأبعاد قبل ما يتحول لجاهز للشحن.</p>
          </Card>
          <Card className="bg-surface p-5">
            <p className="font-display font-semibold mb-1.5">Shipping & Returns</p>
            <p className="text-sm text-muted leading-relaxed">بيتسجل اسم شركة الشحن ورقم التتبع، وأي مرتجع بيتفحص ويتحدد مصيره (رجوع للمخزون / تالف / حجر / إتلاف).</p>
          </Card>
        </div>
        <Card className="bg-ink text-white p-6">
          <p className="text-white/60 text-sm mb-4">دورة حياة الطلب</p>
          <div className="space-y-2">
            {workflow.map((s, i) => (
              <div key={s} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-white/50 w-5">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Button href="/register">ابدأ مع Fulfillment</Button>
    </ContentPage>
  );
}
