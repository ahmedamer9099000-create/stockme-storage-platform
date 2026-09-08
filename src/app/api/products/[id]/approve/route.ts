import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const ApproveSchema = z.object({
  approve: z.boolean(),
  reason: z.string().optional(),
});

// POST /api/products/[id]/approve — staff-only decision on a customer-submitted product.
// Approving posts the requested opening quantity to the inventory ledger; rejecting records why.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const productId = Number(id);
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) return fail("المنتج غير موجود", 404);
  if (product.approvalStatus !== "pending") return fail("تم اتخاذ قرار بشأن هذا المنتج بالفعل");
  const body = await req.json().catch(() => ({}));
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const { approve, reason } = parsed.data;
  if (approve) {
    await db
      .update(schema.products)
      .set({ approvalStatus: "approved", rejectionReason: null })
      .where(eq(schema.products.id, productId));
    if (product.requestedInitialQty && product.requestedInitialQty > 0) {
      await recordMovement({
        productId,
        type: "IN",
        quantity: product.requestedInitialQty,
        userId: user.id,
        reason: "رصيد افتتاحي بعد اعتماد المنتج",
        referenceType: "manual",
      });
    }
  } else {
    await db
      .update(schema.products)
      .set({ approvalStatus: "rejected", rejectionReason: reason ?? null })
      .where(eq(schema.products.id, productId));
  }

  await logAudit({
    userId: user.id,
    action: approve ? "product_approved" : "product_rejected",
    entityType: "product",
    entityId: productId,
    details: JSON.stringify({ sku: product.sku, name: product.name, reason: reason ?? null }),
  });

  const [fresh] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  return ok(fresh);
}