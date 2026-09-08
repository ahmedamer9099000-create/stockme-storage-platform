import Link from "next/link";
import { Button } from "@/components/ui";

const nav = [
  { href: "/how-it-works", label: "كيف تعمل الخدمة" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/fulfillment", label: "Fulfillment" },
  { href: "/features", label: "المميزات" },
  { href: "/about", label: "من نحن" },
  { href: "/faq", label: "الأسئلة الشائعة" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="font-display font-bold text-lg text-brand-dark shrink-0">
          مساحة<span className="text-signal">.</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm text-ink/80">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <Button href="/login" variant="ghost" size="sm">
            تسجيل الدخول
          </Button>
          <Button href="/register" variant="primary" size="sm">
            ابدأ الآن
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-white/70 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display font-bold text-lg text-white mb-2">مساحة</p>
          <p className="text-sm leading-relaxed">مخزنك من غير ما تستأجر مخزن. تخزين مرن وخدمات تجهيز وشحن للتجار وأصحاب المتاجر الإلكترونية في مصر.</p>
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-3">الخدمة</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/how-it-works" className="hover:text-white">كيف تعمل الخدمة</Link></li>
            <li><Link href="/pricing" className="hover:text-white">الأسعار</Link></li>
            <li><Link href="/fulfillment" className="hover:text-white">Fulfillment</Link></li>
            <li><Link href="/features" className="hover:text-white">المميزات</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-3">الشركة</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">من نحن</Link></li>
            <li><Link href="/faq" className="hover:text-white">الأسئلة الشائعة</Link></li>
            <li><Link href="/contact" className="hover:text-white">تواصل معنا</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-3">حسابك</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">تسجيل الدخول</Link></li>
            <li><Link href="/register" className="hover:text-white">إنشاء حساب</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} مساحة — جميع الحقوق محفوظة</div>
    </footer>
  );
}
