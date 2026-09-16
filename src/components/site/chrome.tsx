import Link from "next/link";
import { Button } from "@/components/ui";

const WHATSAPP_NUMBER = "201146135278";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

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

export function WhatsAppButton() {
  const label = "تواصل معنا على واتساب";
  return (
    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label={label} className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform">
      <svg viewBox="0 0 32 32" fill="currentColor" className="w-7 h-7">
        <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.652.874 5.104 2.352 7.084L4.4 28.4l6.48-1.926A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.629 28 15.001 28 8.373 22.629 3 16.001 3Zm6.55 17.19c-.276.777-1.61 1.484-2.213 1.575-.567.084-1.278.12-2.06-.13-.474-.15-1.083-.35-1.865-.688-3.283-1.418-5.427-4.72-5.591-4.941-.164-.222-1.34-1.78-1.34-3.395 0-1.615.849-2.41 1.15-2.741.3-.33.655-.412.874-.412.219 0 .437.002.628.011.202.01.472-.077.738.563.276.66.94 2.276 1.023 2.44.082.164.137.356.027.578-.11.222-.164.356-.328.548-.164.192-.345.43-.492.577-.164.164-.335.343-.144.673.192.33.85 1.404 1.826 2.276 1.255 1.121 2.313 1.468 2.643 1.632.33.164.522.137.715-.082.192-.219.822-.958 1.041-1.288.219-.33.437-.274.738-.164.3.109 1.906.9 2.233 1.064.328.164.546.246.628.383.082.137.082.792-.192 1.569Z" />
      </svg>
    </a>
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
            <li><Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link></li>
            <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white">واتساب: 01146135278</a></li>
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
      <WhatsAppButton />
    </footer>
  );
}