"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon?: string };

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  brandHref,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  brandHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="w-60 shrink-0 border-l border-line bg-ink text-white flex flex-col">
        <Link href={brandHref} className="h-16 flex items-center px-5 font-display font-bold text-lg border-b border-white/10">
          مساحة<span className="text-signal">.</span>
        </Link>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== brandHref && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  active ? "bg-white/10 text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {active && (
                  <span className="absolute right-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-signal" aria-hidden />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-white/50 px-2 mb-2">{roleLabel}</p>
          <button onClick={logout} className="w-full text-right text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-6">
          <div />
          <p className="text-sm text-muted">
            مرحبًا، <span className="text-ink font-medium">{userName}</span>
          </p>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * StatCard now supports an optional `tone` so the overview grid stops reading
 * as eight identical boxes. Tone drives a thin top accent + value color only —
 * the card shape stays consistent, so this reads as emphasis, not decoration.
 *   - "positive": good news (revenue, active customers)
 * - "warning": needs attention but not urgent (low stock, pending payments)
 * - "danger": needs attention now (overdue, damaged)
 * - "neutral": default, no signal either way (default if omitted)
 */
export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const accent = {
    neutral: "border-t-line",
    positive: "border-t-success",
    warning: "border-t-warning",
    danger: "border-t-danger",
  }[tone];
  const valueColor = {
    neutral: "text-ink",
    positive: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div className={clsx("bg-surface border border-line border-t-2 rounded-xl p-4", accent)}>
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={clsx("font-display font-bold text-2xl", valueColor)}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-line-soft/50 text-right">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&>tr:nth-child(even)]:bg-line-soft/30 [&>tr]:transition-colors [&>tr:hover]:bg-line-soft/60">
          {children}
        </tbody>
      </table>
    </div>
  );
}
