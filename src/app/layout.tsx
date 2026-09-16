import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "مساحة | تخزين مرن وخدمات Fulfillment للتجار",
  description: "منصة تخزين مرن وتجهيز طلبات (Fulfillment) لأصحاب المتاجر الإلكترونية والتجار في مصر.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "4562ebb3bf2a49d484e76f94c680f698"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}