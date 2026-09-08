import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { z } from "zod";

// GET /api/products/[id]/movements — full inventory ledger for a product
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const productId = Number(id);

  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) return fail("المنتج غير موجود", 404);
  if (user.role === "CUSTOMER" && product.customerId !== user.customerId) return fail("غير مصرح", 403);

  // NOTE: SQLite's strftime('%s','now') has 1-second resolution, so two movements created
  // within the same second tie on createdAt. `id` is monotonically increasing with insertion
  // order, so it's included as the tiebreaker — without it, rapid successive movements (e.g.
  // pick immediately after receive) can come back in the wrong order.
  const rows = await db
    .select()
    .from(schema.inventoryMovements)
    .where(eq(schema.inventoryMovements.productId, productId))
    .orderBy(desc(schema.inventoryMovements.createdAt), desc(schema.inventoryMovements.id));

  return ok(rows);
}

const AdjustSchema = z.object({
  type: z.enum(["ADJUSTMENT", "DAMAGE"]),
  quantity: z.number().int(),
  reason: z.string().min(1),
});

// POST /api/products/[id]/movements — manual stock adjustment (staff only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = AdjustSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  try {
    const result = await recordMovement({
      productId: Number(id),
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      userId: user.id,
      reason: parsed.data.reason,
      referenceType: "manual",
    });
    return ok(result, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "فشل تعديل المخزون");
  }
}
