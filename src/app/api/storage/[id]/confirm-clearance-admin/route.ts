import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

// POST /api/storage/[id]/confirm-clearance-admin — admin's final sign-off
// on a staff-confirmed clearance. This is step 2 of 2: it moves
// clearanceStatus from "staff_confirmed" to "admin_confirmed", which is the
// only value that makes POST /api/storage's capacity check treat this
// allocation's m² as available again. In this workflow the admin always
// approves (it's a documentation/audit step, not a review that can be
// rejected) — if staff got it wrong, that's handled outside this endpoint.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const allocationId = Number(id);

  const [allocation] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  if (!allocation) return fail("الحجز غير موجود", 404);
  if (allocation.clearanceStatus !== "staff_confirmed") {
    return fail("لا يمكن التأكيد النهائي إلا بعد تأكيد الموظف أولًا");
  }

  await db.update(schema.storageAllocations).set({ clearanceStatus: "admin_confirmed" }).where(eq(schema.storageAllocations.id, allocationId));

  await logAudit({
    userId: user.id,
    action: "storage_clearance_admin_confirmed",
    entityType: "storage_allocation",
    entityId: allocationId,
    details: JSON.stringify({ customerId: allocation.customerId, allocatedM2: allocation.allocatedM2 }),
  });

  const [fresh] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  return ok(fresh);
}