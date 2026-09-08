import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, isResponse } from "@/lib/api-helpers";

// GET /api/picking-tasks?status=pending — the warehouse "queue" employees work from
export async function GET(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let rows = await db.select().from(schema.pickingTasks);
  if (status) rows = rows.filter((t) => t.status === status);

  // enrich with product + location info for the picker's screen
  const enriched = await Promise.all(
    rows.map(async (t) => {
      const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, t.orderItemId));
      const [product] = item ? await db.select().from(schema.products).where(eq(schema.products.id, item.productId)) : [null];
      let location: string | null = null;
      if (product?.binId) {
        const [bin] = await db.select().from(schema.bins).where(eq(schema.bins.id, product.binId));
        location = bin?.code ?? null;
      }
      return { ...t, product: product ?? null, requestedQty: item?.quantity ?? 0, location };
    })
  );

  return ok(enriched);
}
