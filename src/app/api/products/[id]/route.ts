import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

async function loadScoped(id: number, user: Awaited<ReturnType<typeof requireUser>>) {
  if (isResponse(user)) return null;
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, id));
  if (!p) return null;
  if (user.role === "CUSTOMER" && p.customerId !== user.customerId) return null;
  return p;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const product = await loadScoped(Number(id), user);
  if (!product) return fail("المنتج غير موجود", 404);
  return ok(product);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const product = await loadScoped(Number(id), user);
  if (!product) return fail("المنتج غير موجود", 404);

  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "category", "description", "minStock", "unitWeightKg", "unitDimensions", "imageUrl", "barcode", "binId"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const [updated] = await db.update(schema.products).set(patch).where(eq(schema.products.id, product.id)).returning();
  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  await db.delete(schema.products).where(eq(schema.products.id, Number(id)));
  return ok({ deleted: true });
}
