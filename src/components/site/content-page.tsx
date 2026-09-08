import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import type { ReactNode } from "react";

export function ContentPage({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-5 py-16 w-full">
        <h1 className="font-display text-3xl font-bold mb-3">{title}</h1>
        {description && <p className="text-muted text-lg mb-10 max-w-2xl">{description}</p>}
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
