import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

type MovementType = "IN" | "OUT" | "RETURN" | "ADJUSTMENT" | "DAMAGE" | "TRANSFER";

/**
 * The single authorized way to change a product's stock quantity.
 * Writes an immutable ledger row (previous/new balance) AND updates the
 * denormalized products.quantity together via db.batch(), so the two can
 * never drift apart. Every caller in the app (receiving, picking, returns,
 * manual adjustment) must go through this — never write products.quantity directly.
 *
 * NOTE (D1): Cloudflare D1 has no interactive `db.transaction()` like
 * better-sqlite3. The read (checking current balance) happens first, then
 * the two writes are sent together via `db.batch()`, which D1 executes
 * atomically as a single implicit transaction. There is no cross-request
 * row lock between the read and the batch, so two concurrent movements on
 * the same product could theoretically race — acceptable for this app's
 * scale, but worth knowing if traffic grows.
 */
export async function recordMovement(params: {
  productId: number;
  type: MovementType;
  quantity: number; // positive number; direction is implied by `type`
  userId?: number | null;
  reason?: string;
  referenceType?: string;
  referenceId?: number;
}) {
  const { productId, type, quantity, userId, reason, referenceType, referenceId } = params;

  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
  if (!product) throw new Error("Product not found");

  const previousBalance = product.quantity;
  const increasing = type === "IN" || type === "RETURN" || (type === "ADJUSTMENT" && quantity > 0);
  const delta = increasing ? Math.abs(quantity) : -Math.abs(quantity);
  const newBalance = previousBalance + delta;

  if (newBalance < 0) {
    throw new Error(`Insufficient stock for product ${product.sku}: have ${previousBalance}, requested ${Math.abs(quantity)}`);
  }

  await db.batch([
    db.update(schema.products).set({ quantity: newBalance }).where(eq(schema.products.id, productId)),
    db.insert(schema.inventoryMovements).values({
      productId,
      type,
      quantity: Math.abs(quantity),
      previousBalance,
      newBalance,
      userId: userId ?? null,
      reason: reason ?? null,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
    }),
  ]);

  return { previousBalance, newBalance };
}
