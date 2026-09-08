import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const PutawaySchema = z.object({
  items: z.array(z.object({ receivingItemId: z.number(), binId: z.number() })),
});

// POST /api/receiving/[id]/putaway — staff assigns a storage bin to each
// received line item and closes out the order. Also updates the product's
// default binId so future picks know where to look.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const receivingOrderId = Number(id);

  const [ro] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  if (!ro) return fail("أمر الاستلام غير موجود", 404);
  if (ro.status !== "approved") return fail("يجب الموافقة على الأمر أولًا قبل تحديد أماكن التخزين");

  const body = await req.json().catch(() => null);
  const parsed = PutawaySchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  for (const item of parsed.data.items) {
    const [ri] = await db.select().from(schema.receivingItems).where(eq(schema.receivingItems.id, item.receivingItemId));
    if (!ri || ri.receivingOrderId !== receivingOrderId) continue;
    await db.update(schema.receivingItems).set({ binId: item.binId }).where(eq(schema.receivingItems.id, ri.id));
    await db.update(schema.products).set({ binId: item.binId }).where(eq(schema.products.id, ri.productId));
  }

  await db.update(schema.receivingOrders).set({ status: "putaway", putawayAt: Math.floor(Date.now() / 1000) }).where(eq(schema.receivingOrders.id, receivingOrderId));

  const [fresh] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  return ok(fresh);
}