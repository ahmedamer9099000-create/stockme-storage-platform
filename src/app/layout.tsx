import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مساحة | تخزين مرن وخدمات Fulfillment للتجار",
  description: "منصة تخزين مرن وتجهيز طلبات (Fulfillment) لأصحاب المتاجر الإلكترونية والتجار في مصر.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
