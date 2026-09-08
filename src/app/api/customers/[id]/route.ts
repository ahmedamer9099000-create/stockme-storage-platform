import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { deleteCustomerCascade } from "@/lib/customer-cleanup";
import { logAudit } from "@/lib/audit";

// GET /api/customers/[id] — full 360 view: inventory, orders, billing, storage
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const customerId = Number(id);
  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, customerId));
  if (!customer) return fail("العميل غير موجود", 404);
  const [products, orders, invoices, storage] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.customerId, customerId)),
    db.select().from(schema.orders).where(eq(schema.orders.customerId, customerId)),
    db.select().from(schema.invoices).where(eq(schema.invoices.customerId, customerId)),
    db.select().from(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, customerId)),
  ]);
  return ok({ customer, products, orders, invoices, storage });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const customerId = Number(id);
  const body = await req.json().catch(() => ({}));
  const allowed = ["companyName", "businessType", "phone", "whatsapp", "address", "status"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  const [updated] = await db.update(schema.customers).set(patch).where(eq(schema.customers.id, customerId)).returning();
  if (!updated) return fail("العميل غير موجود", 404);

  await logAudit({
    userId: user.id,
    action: "customer_updated",
    entityType: "customer",
    entityId: customerId,
    details: JSON.stringify(patch),
  });

  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const customerId = Number(id);
  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, customerId));
  if (!customer) return fail("العميل غير موجود", 404);

  // Cascades through every related table (orders, invoices, products, storage
  // allocations, etc.) so deletion succeeds even for a customer with an active
  // storage allocation or full transaction history.
  await deleteCustomerCascade(customerId);

  await logAudit({
    userId: user.id,
    action: "customer_deleted",
    entityType: "customer",
    entityId: customerId,
    details: JSON.stringify({ companyName: customer.companyName }),
  });

  return ok({ deleted: true });
}