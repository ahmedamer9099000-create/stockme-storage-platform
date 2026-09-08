import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const ReceiveSchema = z.object({
  items: z.array(
    z.object({
      receivingItemId: z.number(),
      receivedQty: z.number().int().min(0),
      damagedQty: z.number().int().min(0).default(0),
    })
  ),
});

// POST /api/receiving/[id]/confirm — staff records what actually arrived
// (received + damaged per line item). Missing is derived: expected - received - damaged.
// This does NOT touch inventory yet — it just produces the receiving report and
// flags the order for approval. Inventory only moves once an admin approves it
// (see /approve), keeping data-entry mistakes reversible before they hit stock.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const receivingOrderId = Number(id);

  const [ro] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  if (!ro) return fail("أمر الاستلام غير موجود", 404);
  if (ro.status !== "pending") return fail("تم تسجيل استلام هذا الأمر مسبقًا");

  const body = await req.json().catch(() => null);
  const parsed = ReceiveSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  for (const item of parsed.data.items) {
    const [ri] = await db.select().from(schema.receivingItems).where(eq(schema.receivingItems.id, item.receivingItemId));
    if (!ri || ri.receivingOrderId !== receivingOrderId) continue;
    await db
      .update(schema.receivingItems)
      .set({ receivedQty: item.receivedQty, damagedQty: item.damagedQty })
      .where(eq(schema.receivingItems.id, ri.id));
  }

  await db.update(schema.receivingOrders).set({ status: "received", receivedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.receivingOrders.id, receivingOrderId));

  const [fresh] = await db.select().from(schema.receivingOrders).where(eq(schema.receivingOrders.id, receivingOrderId));
  return ok(fresh);
}