import { and, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

const DAY_SECONDS = 24 * 60 * 60;
const WARNING_WINDOW_DAYS = 7;
const GRACE_PERIOD_DAYS = 7;

// Runs once a day via a Cloudflare Cron Trigger. Two independent jobs:
// 1. Nudge customers + admins every day their allocation's endDate is
//    within the warning window and nothing has moved (no renewal pending,
//    not already renewed past the window).
// 2. Auto-end allocations whose endDate passed more than GRACE_PERIOD_DAYS
//    ago with no renewal ever having landed.
//
// `db` is passed in rather than imported from "@/db" because the scheduled
// handler that calls this runs outside the per-request context that
// getCloudflareContext() relies on — it gets `env` directly from the
// Cron event instead, so the caller builds the drizzle instance itself.
export async function runStorageExpiryCheck(db: DrizzleD1Database<typeof schema>) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const warningCutoff = nowSeconds + WARNING_WINDOW_DAYS * DAY_SECONDS;
  const graceCutoff = nowSeconds - GRACE_PERIOD_DAYS * DAY_SECONDS;

  const activeApproved = await db
    .select()
    .from(schema.storageAllocations)
    .where(and(eq(schema.storageAllocations.status, "active"), eq(schema.storageAllocations.approvalStatus, "approved")));

  let remindersSent = 0;
  let allocationsEnded = 0;

  for (const allocation of activeApproved) {
    if (!allocation.endDate) continue;

    if (allocation.endDate <= graceCutoff) {
      await db.update(schema.storageAllocations).set({ status: "ended" }).where(eq(schema.storageAllocations.id, allocation.id));
      allocationsEnded++;

      const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, allocation.customerId));
      if (customer?.userId) {
        await db.insert(schema.notifications).values({
          userId: customer.userId,
          type: "storage_auto_ended",
          title: "تم إنهاء حجز المساحة",
          message: `انتهت مدة حجزك (${allocation.allocatedM2} م²) منذ أكثر من ${GRACE_PERIOD_DAYS} أيام بدون تجديد، وتم إنهاء الحجز تلقائيًا.`,
        });
      }
      continue;
    }

    if (allocation.endDate <= warningCutoff && allocation.pendingRenewalMonths == null) {
      const daysLeft = Math.max(Math.ceil((allocation.endDate - nowSeconds) / DAY_SECONDS), 0);

      const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, allocation.customerId));
      if (customer?.userId) {
        await db.insert(schema.notifications).values({
          userId: customer.userId,
          type: "storage_expiring_soon",
          title: "اقترب انتهاء حجز مساحتك",
          message:
            daysLeft > 0
              ? `باقي ${daysLeft} يوم على انتهاء حجزك (${allocation.allocatedM2} م²). جدد الآن لتجنب توقف الخدمة.`
              : `انتهت مدة حجزك (${allocation.allocatedM2} م²) اليوم. جدد الآن لتجنب إنهاء الحجز.`,
        });
      }

      const admins = await db.select().from(schema.users).where(inArray(schema.users.role, ["ADMIN", "SUPER_ADMIN"]));
      for (const admin of admins) {
        await db.insert(schema.notifications).values({
          userId: admin.id,
          type: "storage_expiring_soon",
          title: "اقتراب انتهاء حجز مساحة عميل",
          message:
            daysLeft > 0
              ? `حجز ${customer?.companyName ?? "عميل"} (${allocation.allocatedM2} م²) ينتهي خلال ${daysLeft} يوم.`
              : `حجز ${customer?.companyName ?? "عميل"} (${allocation.allocatedM2} م²) انتهى اليوم.`,
        });
      }
      remindersSent++;
    }
  }

  return { remindersSent, allocationsEnded };
}