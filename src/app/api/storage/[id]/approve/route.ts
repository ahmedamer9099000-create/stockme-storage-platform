import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const ApproveSchema = z.object({
  approve: z.boolean(),
  reason: z.string().optional(),
});

// Same discount lookup used in POST /api/storage at booking time — kept in
// sync here so a renewal gets the same 3/6/12-month discount a fresh
// booking of that duration would get, instead of carrying over the old fee.
function getDiscountPct(plan: typeof schema.pricingPlans.$inferSelect | undefined, durationMonths: number): number {
  if (!plan) return 0;
  if (durationMonths === 3) return plan.discountPct3m;
  if (durationMonths === 6) return plan.discountPct6m;
  if (durationMonths === 12) return plan.discountPct12m;
  return 0;
}

// POST /api/storage/[id]/approve — staff-only decision on a customer-submitted
// storage booking or renewal request. Approving a fresh booking keeps it
// active; approving a renewal extends endDate by the requested duration and
// recalculates monthlyFee at the current pricing plan's rate for that duration.
// Rejecting a fresh booking ends it; rejecting a renewal just clears the
// pending request and leaves the existing allocation untouched.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const allocationId = Number(id);
  const [allocation] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  if (!allocation) return fail("طلب الحجز غير موجود", 404);

  const isRenewal = allocation.pendingRenewalMonths != null;

  if (!isRenewal && allocation.approvalStatus !== "pending") {
    return fail("تم اتخاذ قرار بشأن هذا الطلب بالفعل");
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const { approve, reason } = parsed.data;

  if (isRenewal) {
    if (approve) {
      const newDurationMonths = allocation.pendingRenewalMonths ?? allocation.durationMonths;
      const extendBySeconds = newDurationMonths * 30 * 24 * 60 * 60;
      const base = allocation.endDate && allocation.endDate > Math.floor(Date.now() / 1000) ? allocation.endDate : Math.floor(Date.now() / 1000);

      const [plan] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1);
      const baseFee = Math.max(allocation.allocatedM2 * (plan?.pricePerM2 ?? 0), plan?.minMonthlyFee ?? 0);
      const discountPct = getDiscountPct(plan, newDurationMonths);
      const newMonthlyFee = baseFee * (1 - discountPct / 100);

      await db
        .update(schema.storageAllocations)
        .set({
          endDate: base + extendBySeconds,
          durationMonths: newDurationMonths,
          monthlyFee: newMonthlyFee,
          pendingRenewalMonths: null,
        })
        .where(eq(schema.storageAllocations.id, allocationId));
    } else {
      await db
        .update(schema.storageAllocations)
        .set({ pendingRenewalMonths: null })
        .where(eq(schema.storageAllocations.id, allocationId));
    }
  } else if (approve) {
    await db
      .update(schema.storageAllocations)
      .set({ approvalStatus: "approved", rejectionReason: null })
      .where(eq(schema.storageAllocations.id, allocationId));
  } else {
    await db
      .update(schema.storageAllocations)
      .set({ approvalStatus: "rejected", rejectionReason: reason ?? null, status: "ended" })
      .where(eq(schema.storageAllocations.id, allocationId));
  }

  await logAudit({
    userId: user.id,
    action: isRenewal ? (approve ? "storage_renewal_approved" : "storage_renewal_rejected") : approve ? "storage_approved" : "storage_rejected",
    entityType: "storage_allocation",
    entityId: allocationId,
    details: JSON.stringify({ customerId: allocation.customerId, allocatedM2: allocation.allocatedM2, reason: reason ?? null }),
  });

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, allocation.customerId));
  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: isRenewal ? (approve ? "storage_renewal_approved" : "storage_renewal_rejected") : approve ? "storage_approved" : "storage_rejected",
      title: isRenewal
        ? approve
          ? "تمت الموافقة على تجديد اشتراكك"
          : "تم رفض طلب التجديد"
        : approve
          ? "تمت الموافقة على حجز المساحة"
          : "تم رفض طلب حجز المساحة",
      message: isRenewal
        ? approve
          ? "تم تمديد فترة اشتراكك في المساحة بنجاح."
          : `تم رفض طلب تجديد اشتراكك${reason ? `: ${reason}` : "."}`
        : approve
          ? `تمت الموافقة على طلبك لحجز ${allocation.allocatedM2} م².`
          : `تم رفض طلبك لحجز ${allocation.allocatedM2} م²${reason ? `: ${reason}` : "."}`,
    });
  }

  const [fresh] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  return ok(fresh);
}