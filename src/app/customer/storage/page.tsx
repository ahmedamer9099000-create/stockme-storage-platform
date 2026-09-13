import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getFreshUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/shell";
import { Card } from "@/components/ui";
import { StorageBooking } from "./storage-booking";
import { RenewalRequest } from "./renewal-request";

export default async function CustomerStoragePage() {
  const user = await getFreshUser();
  if (!user?.customerId) redirect("/login");

  const [allocations, warehouses, allActiveAllocations, plan] = await Promise.all([
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, user.customerId)),
    db.select().from(schema.warehouses),
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.status, "active")),
    db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1),
  ]);
  const activePlan = plan[0];
  const active = allocations.find((a) => a.status === "active" && a.approvalStatus === "approved");
  const pending = allocations.find((a) => a.status === "active" && a.approvalStatus === "pending");

  // Show each warehouse's real remaining capacity (total minus what's already
  // booked by any customer), so a merchant never picks one that's actually full.
  const warehousesWithAvailability = warehouses.map((w) => {
    const occupied = allActiveAllocations.filter((a) => a.warehouseId === w.id).reduce((sum, a) => sum + a.allocatedM2, 0);
    return { ...w, availableM2: Math.max(w.totalCapacityM2 - occupied, 0) };
  });

  return (
    <div>
      <PageHeader title="المساحة" description="مساحتك المخصصة داخل المخزن" />
      {pending ? (
        <Card className="bg-warning-bg border border-warning/30 p-6 max-w-lg text-center">
          <p className="font-semibold text-warning mb-1">طلبك قيد المراجعة</p>
          <p className="text-sm text-muted">
            تم استلام طلبك لحجز {pending.allocatedM2} م² وهو الآن بانتظار موافقة الإدارة. سيتم إعلامك فور اتخاذ القرار.
          </p>
        </Card>
      ) : !active ? (
        <>
          <Card className="bg-surface p-8 text-center text-muted">لا توجد مساحة مخصصة لحسابك حاليًا.</Card>
          <StorageBooking warehouses={warehousesWithAvailability} plan={activePlan} />
        </>
      ) : (
        <Card className="bg-surface p-6 max-w-lg">
          <div className="flex items-end justify-between mb-3">
            <p className="font-display font-bold text-2xl">
              {active.usedM2} <span className="text-base font-normal text-muted">من {active.allocatedM2} م²</span>
            </p>
            <p className="text-sm text-muted">{Math.round((active.usedM2 / active.allocatedM2) * 100)}% مستخدم</p>
          </div>
          <div className="h-3 rounded-full bg-line-soft overflow-hidden">
            <div className="h-full bg-signal rounded-full" style={{ width: `${Math.min((active.usedM2 / active.allocatedM2) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-line">
            <div>
              <p className="text-xs text-muted mb-1">رسوم شهرية</p>
              <p className="font-semibold">{active.monthlyFee.toLocaleString()} EGP</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">المساحة المتاحة</p>
              <p className="font-semibold">{Math.max(active.allocatedM2 - active.usedM2, 0)} م²</p>
            </div>
          </div>
          {active.endDate && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-xs text-muted mb-1">تاريخ انتهاء الاشتراك</p>
              <p className="font-semibold">{new Date(active.endDate * 1000).toLocaleDateString("ar-EG")}</p>
              <RenewalRequest
                allocationId={active.id}
                hasPendingRenewal={active.pendingRenewalMonths != null}
                plan={activePlan}
                allocatedM2={active.allocatedM2}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}