import { db, schema } from "@/db";
import { eq, sum } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const PaySchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["cash", "bank_transfer", "online"]),
  notes: z.string().optional(),
});

// POST /api/invoices/[id]/payments — record a payment; recomputes invoice status
// (paid / partially_paid / pending) from the sum of all completed payments so far.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const invoiceId = Number(id);

  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
  if (!invoice) return fail("الفاتورة غير موجودة", 404);

  const body = await req.json().catch(() => null);
  const parsed = PaySchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  await db.insert(schema.payments).values({ invoiceId, amount: parsed.data.amount, method: parsed.data.method, notes: parsed.data.notes, status: "completed" });

  const [{ total: paidSoFar }] = await db.select({ total: sum(schema.payments.amount) }).from(schema.payments).where(eq(schema.payments.invoiceId, invoiceId));
  const paid = Number(paidSoFar ?? 0);

  const newStatus = paid >= invoice.total ? "paid" : paid > 0 ? "partially_paid" : "pending";
  await db.update(schema.invoices).set({ status: newStatus }).where(eq(schema.invoices.id, invoiceId));

  return ok({ recorded: true, totalPaid: paid, invoiceStatus: newStatus }, 201);
}
