import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { z } from "zod";

const ProcessSchema = z.object({
  condition: z.enum(["good", "damaged", "missing", "destroyed"]),
});

// POST /api/returns/[id]/process — staff inspects received goods and routes them:
//   good      -> RETURN movement (adds back to sellable inventory), status -> processed
//   damaged   -> DAMAGE movement (logged, not resellable), status -> processed
//   destroyed -> DAMAGE movement (logged, disposed of), status -> processed
//   missing   -> no movement yet, status -> investigating (see /resolve to close it out)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const returnId = Number(id);

  const [ret] = await db.select().from(schema.returns).where(eq(schema.returns.id, returnId));
  if (!ret) return fail("طلب الإرجاع غير موجود", 404);
  if (ret.status !== "received") return fail("يجب تأكيد استلام المرتجع أولًا قبل الفحص");

  const body = await req.json().catch(() => null);
  const parsed = ProcessSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");
  const { condition } = parsed.data;

  const items = await db.select().from(schema.returnItems).where(eq(schema.returnItems.returnId, returnId));

  const decisionByCondition = {
    good: "return_to_stock" as const,
    damaged: "damaged" as const,
    destroyed: "dispose" as const,
    missing: "investigate" as const,
  };
  const decision = decisionByCondition[condition];
  const newStatus = condition === "missing" ? "investigating" : "processed";

  for (const item of items) {
    if (condition === "good") {
      await recordMovement({
        productId: item.productId,
        type: "RETURN",
        quantity: item.quantity,
        userId: user.id,
        reason: `مرتجع رقم ${ret.returnNumber} — إعادة للمخزون (سليم)`,
        referenceType: "return",
        referenceId: returnId,
      });
    } else if (condition === "damaged" || condition === "destroyed") {
      // logged for traceability only; goods do not re-enter sellable stock
      await recordMovement({
        productId: item.productId,
        type: "DAMAGE",
        quantity: 0, // zero-effect ledger entry: record the event without touching balance twice
        userId: user.id,
        reason: `مرتجع رقم ${ret.returnNumber} — ${condition === "damaged" ? "تالف" : "تم الإتلاف منه"}`,
        referenceType: "return",
        referenceId: returnId,
      });
    }
    // missing: intentionally no movement — awaiting investigation outcome
  }

  const [updated] = await db
    .update(schema.returns)
    .set({
      condition,
      decision,
      status: newStatus,
      processedAt: newStatus === "processed" ? Math.floor(Date.now() / 1000) : null,
    })
    .where(eq(schema.returns.id, returnId))
    .returning();

  return ok(updated);
}