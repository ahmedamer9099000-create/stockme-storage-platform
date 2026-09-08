import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

// GET /api/settings/pricing — the default pricing plan (public-ish: used by the calculator, so any authenticated staff can view; admins edit)
export async function GET() {
  const [plan] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1);
  if (!plan) return fail("لا توجد خطة تسعير افتراضية", 404);
  return ok(plan);
}

const UpdateSchema = z.object({
  pricePerM2: z.number().positive().optional(),
  minMonthlyFee: z.number().min(0).optional(),
  pricePerCarton: z.number().min(0).optional(),
  pricePerPallet: z.number().min(0).optional(),
  receivingFee: z.number().min(0).optional(),
  pickingFee: z.number().min(0).optional(),
  packingFee: z.number().min(0).optional(),
  returnFee: z.number().min(0).optional(),
  shippingHandlingFee: z.number().min(0).optional(),
});

// PATCH /api/settings/pricing — this is "Admin Settings → Pricing": every fee in the system
// flows from here; nothing is hard-coded in the UI or the invoice generator.
export async function PATCH(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  const [existing] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1);
  if (!existing) return fail("لا توجد خطة تسعير افتراضية لتعديلها", 404);

  const [updated] = await db.update(schema.pricingPlans).set(parsed.data).where(eq(schema.pricingPlans.id, existing.id)).returning();
  return ok(updated);
}
