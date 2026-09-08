import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const warehouseId = Number(id);

  // Guard: don't delete a warehouse that still has active storage allocations —
  // that would silently orphan customer bookings against a warehouse that no longer exists.
  const activeAllocations = await db
    .select()
    .from(schema.storageAllocations)
    .where(eq(schema.storageAllocations.warehouseId, warehouseId));
  const hasActive = activeAllocations.some((a) => a.status === "active");
  if (hasActive) {
    return fail("لا يمكن حذف مخزن مرتبط بمساحات تخزين نشطة لعملاء — أنهِ التخصيصات أولاً", 409);
  }

  await db.delete(schema.warehouses).where(eq(schema.warehouses.id, warehouseId));
  return ok({ deleted: true });
}
