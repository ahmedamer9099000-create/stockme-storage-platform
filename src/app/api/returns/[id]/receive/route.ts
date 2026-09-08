import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

// POST /api/returns/[id]/receive — staff confirms the returned goods physically
// arrived at the warehouse. Moves requested -> received, unlocking inspection.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const returnId = Number(id);

  const [ret] = await db.select().from(schema.returns).where(eq(schema.returns.id, returnId));
  if (!ret) return fail("طلب الإرجاع غير موجود", 404);
  if (ret.status !== "requested") return fail("تم استلام هذا المرتجع بالفعل أو تمت معالجته");

  const [updated] = await db
    .update(schema.returns)
    .set({ status: "received", receivedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.returns.id, returnId))
    .returning();

  return ok(updated);
}