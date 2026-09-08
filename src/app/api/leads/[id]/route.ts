import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["status", "notes", "followUpDate", "assignedTo"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const [updated] = await db.update(schema.leads).set(patch).where(eq(schema.leads.id, Number(id))).returning();
  if (!updated) return fail("العميل المحتمل غير موجود", 404);
  return ok(updated);
}
