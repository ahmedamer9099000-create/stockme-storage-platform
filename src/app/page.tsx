import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { Button, Card } from "@/components/ui";

const steps = [
  { n: "01", title: "احجز مساحتك", body: "اختر المساحة المناسبة لحجم بضاعتك من 5 إلى 100 م²، وابدأ التخزين خلال 24 ساعة." },
  { n: "02", title: "سلّم بضاعتك", body: "فريقنا يستلم بضاعتك، يفحصها، ويسجّلها في نظام المخزون بموقع دقيق داخل المخزن." },
  { n: "03", title: "تابع مخزونك", body: "من لوحة التحكم الخاصة بك، شوف كل منتج وكميته ومكانه لحظة بلحظة." },
  { n: "04", title: "اطلب تجهيز وشحن", body: "اطلب تجهيز أي طلب، وإحنا نتولى الـ Picking والـ Packing والتسليم لشركة الشحن." },
];

const packages = [
  { name: "Starter", desc: "لتاجر بيبدأ ولسه بضاعته قليلة", price: "من 2,750 EGP/شهر", features: ["حتى 5 م² تخزين", "تسجيل مخزون أساسي", "دعم عبر واتساب"] },
  { name: "Business", desc: "الأنسب لمعظم متاجر الأونلاين", price: "من 4,000 EGP/شهر", features: ["10-15 م² تخزين", "لوحة تحكم كاملة", "تقارير مخزون دورية"], highlight: true },
  { name: "Pro", desc: "لو بتحتاج تجهيز وتغليف بانتظام", price: "من 7,000 EGP/شهر", features: ["تخزين + Picking + Packing", "عدد طلبات شهري ضمن الباقة", "أولوية في التجهيز"] },
  { name: "Enterprise", desc: "لحجم بضاعة أكبر واحتياج مخصص", price: "تسعير مخصص", features: ["30 م²+ / Fulfillment كامل", "إدارة مرتجعات متكاملة", "تقارير مخصصة"] },
];

const faqs = [
  { q: "هل أقدر أستأجر مساحة صغيرة جدًا؟", a: "أيوه، أقل مساحة عندنا 5 متر مربع، وبتقدر تزوّدها أو تقللها حسب حجم بضاعتك." },
  { q: "هل التخزين مؤمَّن ضد الحريق والسرقة؟", a: "المخزن مجهّز بكاميرات مراقبة، أجهزة إنذار حريق، وباب مؤمَّن. تفاصيل التأمين على البضاعة نفسها موضحة في العقد." },
  { q: "هل أقدر أطلب تجهيز وشحن الطلبات مش بس تخزين؟", a: "أيوه، دي بالظبط فكرة خدمة الـ Fulfillment — بنستلم طلب العميل بتاعك، نجهزه، نغلفه، ونسلمه لشركة الشحن." },
  { q: "إزاي أعرف مخزوني الفعلي دايمًا؟", a: "لوحة التحكم بتوريك كل منتج وكميته ومكانه لحظة بلحظة، وكل حركة دخول أو خروج بتتسجل تلقائيًا." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white to-canvas">
          <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="pill bg-line-soft text-brand-dark mb-5">تخزين مرن + Fulfillment</span>
              <h1 className="font-display text-4xl lg:text-5xl font-bold leading-[1.15] text-ink mb-5">
                مخزنك<br />من غير ما تستأجر مخزن
              </h1>
              <p className="text-lg text-muted leading-relaxed mb-8 max-w-md">
                ادفع بس على المساحة اللي بتستخدمها فعلاً. من التخزين للتجهيز للتغليف للشحن، كل حاجة تحت سقف واحد ومتابعة لحظة بلحظة.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/register" size="md">ابدأ الآن</Button>
                <Button href="/pricing" variant="ghost" size="md">احسب تكلفة التخزين</Button>
              </div>
            </div>

            {/* signature element: a bin-path "fill up" illustration */}
            <Card className="p-6 lg:p-8 bg-surface">
              <p className="text-xs text-muted mb-4">موقع بضاعتك داخل المخزن — دقيق لآخر صندوق</p>
              <div className="space-y-3 font-mono text-sm" dir="ltr">
                {[
                  ["WH-A", "Z1", "R11", "S2", "B1"],
                  ["WH-A", "Z1", "R12", "S1", "B2"],
                  ["WH-A", "Z2", "R21", "S3", "B1"],
                ].map((path, i) => (
                  <div key={i} className="bin-path">
                    {path.map((s, j) => (
                      <span key={j} className="flex items-center gap-1.5">
                        <span className="seg">{s}</span>
                        {j < path.length - 1 && <span className="sep">/</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-line grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-display font-bold text-2xl text-brand-dark">100م²</p>
                  <p className="text-xs text-muted mt-0.5">إجمالي المساحة</p>
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-signal">67م²</p>
                  <p className="text-xs text-muted mt-0.5">مستخدمة</p>
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-success">33م²</p>
                  <p className="text-xs text-muted mt-0.5">متاحة</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="font-display text-2xl font-bold mb-2">كيف تعمل الخدمة؟</h2>
          <p className="text-muted mb-10">أربع خطوات بسيطة من حجز المساحة لحد استلام عميلك للشحنة</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <Card key={s.n} className="p-5 bg-surface">
                <p className="font-mono text-signal text-sm mb-3">{s.n}</p>
                <p className="font-display font-semibold mb-1.5">{s.title}</p>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* WHY US */}
        <section className="bg-brand-dark text-white">
          <div className="max-w-6xl mx-auto px-5 py-16 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">ليه تختار مساحة؟</h2>
              <ul className="space-y-3 text-white/85 text-sm leading-relaxed">
                <li>• من غير عقد سنة كاملة — تقدر تزوّد أو تقلل مساحتك شهر بشهر.</li>
                <li>• بضاعتك متسجّلة ومتابعة أول بأول، مش دفتر ومش حفظ في الدماغ.</li>
                <li>• من التخزين للتغليف للشحن، خدمة واحدة متكاملة بدل ما تجمّع موردين.</li>
                <li>• تقدر تشوف مخزونك بالكامل من لوحة تحكمك في أي وقت.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["24 ساعة", "بدء التخزين من لحظة الحجز"],
                ["5-100م²", "مرونة المساحة حسب حجم بضاعتك"],
                ["Hybrid", "نموذج تسعير عادل حسب الاستخدام"],
                ["لحظي", "تحديث المخزون مع كل حركة"],
              ].map(([big, small]) => (
                <div key={big} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="font-display font-bold text-xl text-signal">{big}</p>
                  <p className="text-xs text-white/70 mt-1">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES */}
        <section id="packages" className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="font-display text-2xl font-bold mb-2">الباقات</h2>
          <p className="text-muted mb-10">اختر الباقة الأقرب لحجمك — والأسعار قابلة للتخصيص دايمًا حسب احتياجك</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packages.map((p) => (
              <Card key={p.name} className={`p-5 flex flex-col bg-surface ${p.highlight ? "border-signal border-2" : ""}`}>
                {p.highlight && <span className="pill bg-signal text-white self-start mb-3">الأكثر طلبًا</span>}
                <p className="font-display font-bold text-lg">{p.name}</p>
                <p className="text-sm text-muted mt-1 mb-4">{p.desc}</p>
                <p className="font-display font-bold text-brand-dark mb-4">{p.price}</p>
                <ul className="space-y-2 text-sm text-ink/80 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Button href="/register" variant={p.highlight ? "primary" : "ghost"} size="sm">
                  ابدأ بـ {p.name}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* FULFILLMENT teaser */}
        <section className="max-w-6xl mx-auto px-5 py-20">
          <Card className="p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center bg-canvas">
            <div>
              <span className="pill bg-line-soft text-brand-dark mb-4">Mini Fulfillment Center</span>
              <h2 className="font-display text-2xl font-bold mb-3">مش مجرد تخزين — تجهيز وشحن كمان</h2>
              <p className="text-muted leading-relaxed mb-6">لما طلب يوصلك من عميلك، إحنا بنستلمه، نجهزه (Picking)، نغلفه (Packing)، ونسلمه لشركة الشحن — وكل ده متسجل ومتابع في لوحة تحكمك.</p>
              <Button href="/fulfillment" variant="secondary" size="sm">اعرف أكتر عن Fulfillment</Button>
            </div>
            <div className="space-y-2">
              {["Pending", "Picking", "Picked", "Packing", "Packed", "Shipped"].map((s, i) => (
                <div key={s} className="flex items-center gap-3 bg-surface border border-line rounded-lg px-4 py-2.5">
                  <span className="font-mono text-xs text-muted w-5">{i + 1}</span>
                  <span className="text-sm font-medium">{s}</span>
                  <span className="mr-auto text-signal text-xs">●</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-6xl mx-auto px-5 py-20">
          <h2 className="font-display text-2xl font-bold mb-10">تجار بيستخدموا مساحة</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: "متجر لمسة", role: "إكسسوارات حريمي", quote: "وفرت عليا إيجار مخزن كامل وأنا لسه بضاعتي محدودة. دلوقتي بس بدفع على اللي بستخدمه." },
              { name: "ذا شوز بوكس", role: "أحذية أونلاين", quote: "أهم حاجة إني بشوف مخزوني ومكانه بالظبط من لوحة التحكم، مش بقالب في الدماغ زي الأول." },
              { name: "نور للتجميل", role: "مستحضرات تجميل", quote: "خدمة التجهيز والتغليف وفرت عليا وقت كبير، بقيت بس بستلم إشعار إن الطلب اتشحن." },
            ].map((t) => (
              <Card key={t.name} className="p-5 bg-surface">
                <p className="text-sm text-ink/80 leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 py-20">
          <h2 className="font-display text-2xl font-bold mb-10 text-center">أسئلة شائعة</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <Card key={f.q} className="p-5 bg-surface">
                <p className="font-semibold mb-1.5">{f.q}</p>
                <p className="text-sm text-muted leading-relaxed">{f.a}</p>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted mt-6">
            عندك سؤال تاني؟ <Link href="/faq" className="text-brand font-medium">شوف كل الأسئلة</Link> أو <Link href="/contact" className="text-brand font-medium">تواصل معانا</Link>
          </p>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-6xl mx-auto px-5 pb-20">
          <Card className="p-10 lg:p-14 text-center bg-ink text-white border-none">
            <h2 className="font-display text-2xl lg:text-3xl font-bold mb-3">جاهز تبدأ تخزين بضاعتك؟</h2>
            <p className="text-white/70 mb-7 max-w-md mx-auto">احجز مساحتك دلوقتي وابدأ التخزين خلال 24 ساعة، أو احسب تكلفتك التقديرية أول.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/register" size="md">احجز مساحتك الآن</Button>
              <Button href="/pricing" variant="ghost" size="md" className="!text-white !border-white/30 hover:!bg-white/10">
                احسب تكلفة التخزين
              </Button>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
