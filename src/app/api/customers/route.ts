import { db, schema } from "@/db";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const rows = await db.select().from(schema.customers);
  return ok(rows);
}

const CreateCustomerSchema = z.object({
  companyName: z.string().min(2),
  businessType: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  // optionally create a login for this customer right away
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
});

// POST /api/customers — admin manually creates a customer (with or without login access)
export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = CreateCustomerSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;

  const [customer] = await db
    .insert(schema.customers)
    .values({
      companyName: data.companyName,
      businessType: data.businessType,
      phone: data.phone,
      whatsapp: data.whatsapp,
      address: data.address,
    })
    .returning();

  if (data.email && data.password) {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (existing) return fail("البريد الإلكتروني مستخدم بالفعل", 409);
    const passwordHash = await hashPassword(data.password);
    await db.insert(schema.users).values({
      name: data.name ?? data.companyName,
      email: data.email,
      passwordHash,
      role: "CUSTOMER",
      customerId: customer.id,
    });
  }

  return ok(customer, 201);
}
