import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

// POST /api/storage/[id]/confirm-clearance — staff confirm that a customer's
// products have been physically removed from an ended allocation's space.
// Until this is called, storage-expiry-check.ts's auto-end keeps this
// allocation's m² counted as occupied (see clearanceConfirmed check in
// POST /api/storage) so the space can't be silently handed to a new
// customer while the old one's goods are still sitting there.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const allocationId = Number(id);

  const [allocation] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  if (!allocation) return fail("الحجز غير موجود", 404);
  if (allocation.status !== "ended") return fail("لا يمكن تأكيد الإخلاء إلا لحجز منتهٍ");
  if (allocation.clearanceConfirmed) return fail("تم تأكيد إخلاء هذه المساحة بالفعل");

  await db.update(schema.storageAllocations).set({ clearanceConfirmed: true }).where(eq(schema.storageAllocations.id, allocationId));

  await logAudit({
    userId: user.id,
    action: "storage_clearance_confirmed",
    entityType: "storage_allocation",
    entityId: allocationId,
    details: JSON.stringify({ customerId: allocation.customerId, allocatedM2: allocation.allocatedM2 }),
  });

  const [fresh] = await db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.id, allocationId));
  return ok(fresh);
}