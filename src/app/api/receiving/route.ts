import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  let rows = await db.select().from(schema.receivingOrders);
  if (user.role === "CUSTOMER") rows = rows.filter((r) => r.customerId === user.customerId);
  return ok(rows);
}

const ItemSchema = z.object({ productId: z.number(), expectedQty: z.number().int().min(0) });
const CreateSchema = z.object({
  customerId: z.number(),
  warehouseId: z.number(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(ItemSchema).min(1),
});

// POST /api/receiving — create a pending receiving order (goods not yet counted/confirmed)
export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;

  // NOTE (D1): no interactive db.transaction() — receiving order is inserted
  // first (its id is needed for the items), then items are written together
  // atomically via db.batch().
  const [result] = await db
    .insert(schema.receivingOrders)
    .values({
      customerId: data.customerId,
      warehouseId: data.warehouseId,
      supplier: data.supplier,
      notes: data.notes,
      createdBy: user.id,
      status: "pending",
    })
    .returning();

  const statements = data.items.map((item) =>
    db.insert(schema.receivingItems).values({ receivingOrderId: result.id, productId: item.productId, expectedQty: item.expectedQty, receivedQty: 0 })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.batch(statements as any);

  return ok(result, 201);
}
