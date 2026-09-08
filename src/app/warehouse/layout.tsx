import { redirect } from "next/navigation";
import { getFreshUser } from "@/lib/auth";
import { DashboardShell, NavItem } from "@/components/dashboard/shell";

const navItems: NavItem[] = [
  { href: "/warehouse", label: "لوحة اليوم" },
  { href: "/warehouse/receiving", label: "الاستلام" },
  { href: "/warehouse/picking", label: "التجهيز (Picking)" },
  { href: "/warehouse/packing", label: "التغليف (Packing)" },
  { href: "/warehouse/handoffs", label: "تسليم كراتين" },
  { href: "/warehouse/payments", label: "المدفوعات" },
  { href: "/warehouse/returns", label: "المرتجعات" },
];

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshUser();
  if (!user || !["WAREHOUSE_EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/login");
  return (
    <DashboardShell navItems={navItems} roleLabel="فريق المخزن" userName={user.name} brandHref="/warehouse">
      {children}
    </DashboardShell>
  );
}