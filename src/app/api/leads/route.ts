import { db, schema } from "@/db";
import { getFreshUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";
import { z } from "zod";

// GET /api/leads — staff-only CRM view
export async function GET() {
  const user = await getFreshUser();
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return fail("غير مصرح", 403);
  const rows = await db.select().from(schema.leads);
  return ok(rows);
}

const LeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  whatsapp: z.string().optional(),
  businessType: z.string().optional(),
  requiredSpaceM2: z.number().optional(),
  numberOfProducts: z.number().int().optional(),
  requiredServices: z.array(z.string()).optional(),
});

// POST /api/leads — public: the landing-page lead form ("احجز مساحتك الآن" / "اطلب عرض سعر")
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const data = parsed.data;

  const [lead] = await db
    .insert(schema.leads)
    .values({
      name: data.name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      businessType: data.businessType,
      requiredSpaceM2: data.requiredSpaceM2,
      numberOfProducts: data.numberOfProducts,
      requiredServices: data.requiredServices ? JSON.stringify(data.requiredServices) : null,
      status: "new",
    })
    .returning();

  return ok(lead, 201);
}
