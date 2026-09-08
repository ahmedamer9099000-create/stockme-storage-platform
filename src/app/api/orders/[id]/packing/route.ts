import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const PackSchema = z.object({
  packagingType: z.string().optional(),
  weightKg: z.number().optional(),
  dimensions: z.string().optional(),
  packagingCost: z.number().optional(),
  notes: z.string().optional(),
});

// POST /api/orders/[id]/packing — "Mark as Packed" from the Packing Station screen.
// Requires the order to already be fully picked.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const orderId = Number(id);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return fail("الطلب غير موجود", 404);
  if (order.status !== "picked") return fail("يجب إتمام التجهيز (Picking) بالكامل قبل التغليف");

  const body = await req.json().catch(() => null);
  const parsed = PackSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  const [existing] = await db.select().from(schema.packingTasks).where(eq(schema.packingTasks.orderId, orderId));

  if (existing) {
    await db
      .update(schema.packingTasks)
      .set({ ...parsed.data, status: "packed", packedBy: user.id, completedAt: Math.floor(Date.now() / 1000) })
      .where(eq(schema.packingTasks.id, existing.id));
  } else {
    await db.insert(schema.packingTasks).values({
      orderId,
      ...parsed.data,
      status: "packed",
      packedBy: user.id,
      completedAt: Math.floor(Date.now() / 1000),
    });
  }

  await db.update(schema.orders).set({ status: "packed" }).where(eq(schema.orders.id, orderId));

  return ok({ packed: true });
}
