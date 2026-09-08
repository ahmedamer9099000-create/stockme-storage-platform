import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { z } from "zod";

const ResolveSchema = z.object({
  found: z.boolean(), // true: the "missing" goods turned up -> return to stock. false: confirmed lost.
});

// POST /api/returns/[id]/resolve — closes out a return stuck in "investigating"
// (i.e. goods marked missing during inspection). Either the goods turned up
// (return to stock) or the investigation confirms them lost for good.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const returnId = Number(id);

  const [ret] = await db.select().from(schema.returns).where(eq(schema.returns.id, returnId));
  if (!ret) return fail("طلب الإرجاع غير موجود", 404);
  if (ret.status !== "investigating") return fail("هذا المرتجع ليس قيد التحقيق حاليًا");

  const body = await req.json().catch(() => null);
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  const items = await db.select().from(schema.returnItems).where(eq(schema.returnItems.returnId, returnId));

  if (parsed.data.found) {
    for (const item of items) {
      await recordMovement({
        productId: item.productId,
        type: "RETURN",
        quantity: item.quantity,
        userId: user.id,
        reason: `مرتجع رقم ${ret.returnNumber} — تم العثور عليه بعد التحقيق`,
        referenceType: "return",
        referenceId: returnId,
      });
    }
  }

  const [updated] = await db
    .update(schema.returns)
    .set({
      condition: parsed.data.found ? "good" : "missing",
      decision: parsed.data.found ? "return_to_stock" : "dispose",
      status: "processed",
      processedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(schema.returns.id, returnId))
    .returning();

  return ok(updated);
}