import { db, schema } from "@/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const RenewSchema = z.object({
  durationMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const allocationId = Number(id);

  const [allocation] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  if (!allocation) return fail("الحجز غير موجود", 404);
  if (allocation.customerId !== user.customerId) return fail("غير مصرح لك بهذا الإجراء", 403);
  if (allocation.status !== "active" || allocation.approvalStatus !== "approved") {
    return fail("لا يمكن طلب تجديد لهذا الحجز حاليًا");
  }
  if (allocation.pendingRenewalMonths != null) return fail("يوجد طلب تجديد قيد المراجعة بالفعل");

  const body = await req.json().catch(() => ({}));
  const parsed = RenewSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  const updated = await db
    .update(schema.storageAllocations)
    .set({ pendingRenewalMonths: parsed.data.durationMonths })
    .where(and(
      eq(schema.storageAllocations.id, allocationId),
      isNull(schema.storageAllocations.pendingRenewalMonths)
    ))
    .returning();
  if (!updated.length) return fail("يوجد طلب تجديد قيد المراجعة بالفعل");

  await logAudit({
    userId: user.id,
    action: "storage_renewal_requested",
    entityType: "storage_allocation",
    entityId: allocationId,
    details: JSON.stringify({ durationMonths: parsed.data.durationMonths }),
  });

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, allocation.customerId));

  if (customer?.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "storage_renewal_requested",
      title: "طلب تجديد قيد المراجعة",
      message: `تم استلام طلبك لتجديد الاشتراك لمدة ${parsed.data.durationMonths} شهر، وهو الآن بانتظار موافقة الإدارة.`,
    });
  }

  const admins = await db.select().from(schema.users).where(inArray(schema.users.role, ["ADMIN", "SUPER_ADMIN"]));
  for (const admin of admins) {
    await db.insert(schema.notifications).values({
      userId: admin.id,
      type: "storage_renewal_requested",
      title: "طلب تجديد اشتراك مساحة",
      message: `${customer?.companyName ?? "عميل"} طلب تجديد اشتراكه لمدة ${parsed.data.durationMonths} شهر.`,
    });
  }

  const [fresh] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  return ok(fresh);
}