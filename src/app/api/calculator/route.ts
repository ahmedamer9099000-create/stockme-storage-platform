import { getDefaultPricingPlan, estimateMonthlyCost } from "@/lib/pricing";
import { ok, fail } from "@/lib/api-helpers";
import { z } from "zod";

const CalcSchema = z.object({
  areaM2: z.number().positive(),
  durationMonths: z.number().int().positive().default(1),
  numberOfProducts: z.number().int().min(0).default(0),
  numberOfCartons: z.number().int().min(0).default(0),
  needsInventoryManagement: z.boolean().default(false),
  needsPicking: z.boolean().default(false),
  needsPacking: z.boolean().default(false),
  needsShipping: z.boolean().default(false),
  estimatedOrdersPerMonth: z.number().int().min(0).default(0),
});

// POST /api/calculator — public endpoint backing the homepage "Storage Calculator".
// Deliberately unauthenticated: it's a lead-generation tool, not a customer-account feature.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CalcSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  const plan = await getDefaultPricingPlan();
  if (!plan) return fail("النظام غير جاهز حاليًا لحساب التكلفة — لا توجد خطة تسعير مُعرَّفة", 503);

  const estimate = estimateMonthlyCost(plan, parsed.data);
  return ok(estimate);
}
