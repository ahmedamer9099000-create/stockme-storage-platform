import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  let rows = await db.select().from(schema.orders);
  if (user.role === "CUSTOMER") rows = rows.filter((o) => o.customerId === user.customerId);
  return ok(rows);
}

const CreateOrderSchema = z.object({
  customerId: z.number().optional(),
  shippingAddress: z.string().min(3),
  paymentMethod: z.enum(["cod", "online"]).optional(),
  items: z.array(z.object({ productId: z.number(), quantity: z.number().int().positive() })).min(1),
});

function genOrderNumber() {
  return "ORD-" + Date.now().toString(36).toUpperCase();
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;

  const customerId = user.role === "CUSTOMER" ? user.customerId! : data.customerId;
  if (!customerId) return fail("customerId مطلوب");

  const [result] = await db
    .insert(schema.orders)
    .values({
      orderNumber: genOrderNumber(),
      customerId,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod ?? "cod",
      status: "pending",
    })
    .returning();

  const statements = data.items.map((item) => db.insert(schema.orderItems).values({ orderId: result.id, productId: item.productId, quantity: item.quantity }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.batch(statements as any);

  return ok(result, 201);
}