import { db, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

// POST /api/storage/[id]/confirm-clearance — warehouse staff confirm they've
// physically verified a customer's products were removed from an ended
// allocation's space. This is step 1 of 2: it moves clearanceStatus from
// "pending" to "staff_confirmed" and notifies admins, but does NOT free up
// the space yet — that only happens once an admin signs off via
// POST /api/storage/[id]/confirm-clearance-admin. The space keeps counting
// as occupied in POST /api/storage's capacity check the whole time (see the
// clearanceStatus != "admin_confirmed" condition there).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const allocationId = Number(id);

  const [allocation] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  if (!allocation) return fail("الحجز غير موجود", 404);
  if (allocation.status !== "ended") return fail("لا يمكن تأكيد الإخلاء إلا لحجز منتهٍ");
  if (allocation.clearanceStatus !== "pending") return fail("تم تسجيل تأكيد الإخلاء لهذه المساحة بالفعل");

  await db.update(schema.storageAllocations).set({ clearanceStatus: "staff_confirmed" }).where(eq(schema.storageAllocations.id, allocationId));

  await logAudit({
    userId: user.id,
    action: "storage_clearance_staff_confirmed",
    entityType: "storage_allocation",
    entityId: allocationId,
    details: JSON.stringify({ customerId: allocation.customerId, allocatedM2: allocation.allocatedM2 }),
  });

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, allocation.customerId));
  const admins = await db.select().from(schema.users).where(inArray(schema.users.role, ["ADMIN", "SUPER_ADMIN"]));
  for (const admin of admins) {
    await db.insert(schema.notifications).values({
      userId: admin.id,
      type: "storage_clearance_needs_admin_confirmation",
      title: "تأكيد إخلاء مساحة يحتاج موافقتك النهائية",
      message: `${user.name} أكّد إخلاء مساحة ${customer?.companyName ?? "عميل"} (${allocation.allocatedM2} م²) فعليًا. يرجى مراجعة وتأكيد ذلك نهائيًا لإتاحة المساحة.`,
    });
  }

  const [fresh] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  return ok(fresh);
}