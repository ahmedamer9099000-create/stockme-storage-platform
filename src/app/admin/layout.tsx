import { redirect } from "next/navigation";
import { getFreshUser } from "@/lib/auth";
import { DashboardShell, NavItem } from "@/components/dashboard/shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/login");

  const navItems: NavItem[] = [
    { href: "/admin", label: "نظرة عامة" },
    { href: "/admin/customers", label: "العملاء" },
    { href: "/admin/warehouses", label: "المخازن" },
    { href: "/admin/products", label: "المنتجات والمخزون" },
    { href: "/admin/orders", label: "الطلبات" },
    { href: "/admin/invoices", label: "الفواتير" },
    { href: "/admin/leads", label: "العملاء المحتملون" },
    { href: "/admin/reports", label: "التقارير" },
    { href: "/admin/pricing", label: "إعدادات التسعير" },
    ...(user.role === "SUPER_ADMIN" ? [{ href: "/admin/audit-log", label: "سجل التدقيق" }] : []),
  ];

  return (
    <DashboardShell navItems={navItems} roleLabel={user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"} userName={user.name} brandHref="/admin">
      {children}
    </DashboardShell>
  );
}