import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  let rows = await db.select().from(schema.invoices);
  if (user.role === "CUSTOMER") rows = rows.filter((i) => i.customerId === user.customerId);
  return ok(rows);
}
