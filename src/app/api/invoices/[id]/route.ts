import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const invoiceId = Number(id);

  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
  if (!invoice) return fail("الفاتورة غير موجودة", 404);
  if (user.role === "CUSTOMER" && invoice.customerId !== user.customerId) return fail("غير مصرح", 403);

  const [items, paymentsRows] = await Promise.all([
    db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoiceId)),
    db.select().from(schema.payments).where(eq(schema.payments.invoiceId, invoiceId)),
  ]);

  return ok({ invoice, items, payments: paymentsRows });
}
