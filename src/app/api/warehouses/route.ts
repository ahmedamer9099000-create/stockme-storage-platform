import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const rows = await db.select().from(schema.warehouses);
  return ok(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  totalCapacityM2: z.number().positive(),
});

export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const [row] = await db.insert(schema.warehouses).values(parsed.data).returning();
  return ok(row, 201);
}
