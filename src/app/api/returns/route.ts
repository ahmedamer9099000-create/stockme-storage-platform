import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  let rows = await db.select().from(schema.returns);
  if (user.role === "CUSTOMER") rows = rows.filter((r) => r.customerId === user.customerId);
  return ok(rows);
}

const CreateSchema = z.object({
  orderId: z.number().optional(),
  customerId: z.number().optional(),
  reason: z.string().min(1),
  items: z.array(z.object({ productId: z.number(), quantity: z.number().int().positive() })).min(1),
});

function genReturnNumber() {
  return "RET-" + Date.now().toString(36).toUpperCase();
}

// POST /api/returns — customer (or staff on their behalf) opens a return request.
// Starts life as "requested"; moves through received -> inspection -> processed/investigating.
export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;
  const customerId = user.role === "CUSTOMER" ? user.customerId! : data.customerId;
  if (!customerId) return fail("customerId مطلوب");

  // NOTE (D1): no interactive db.transaction() — return is inserted first
  // (its id is needed for the items), then items are written together
  // atomically via db.batch().
  const [result] = await db
    .insert(schema.returns)
    .values({ returnNumber: genReturnNumber(), orderId: data.orderId, customerId, reason: data.reason, status: "requested" })
    .returning();
  const statements = data.items.map((item) => db.insert(schema.returnItems).values({ returnId: result.id, productId: item.productId, quantity: item.quantity }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.batch(statements as any);
  return ok(result, 201);
}