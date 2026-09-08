import { redirect } from "next/navigation";
import { getFreshUser } from "@/lib/auth";
import { DashboardShell, NavItem } from "@/components/dashboard/shell";

const navItems: NavItem[] = [
  { href: "/customer", label: "نظرة عامة" },
  { href: "/customer/inventory", label: "مخزوني" },
  { href: "/customer/orders", label: "الطلبات" },
  { href: "/customer/storage", label: "المساحة" },
  { href: "/customer/billing", label: "الفواتير والمدفوعات" },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshUser();
  if (!user || user.role !== "CUSTOMER") redirect("/login");

  return (
    <DashboardShell navItems={navItems} roleLabel="حساب عميل" userName={user.name} brandHref="/customer">
      {children}
    </DashboardShell>
  );
}
