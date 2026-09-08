import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function getDefaultPricingPlan() {
  const [plan] = await db.select().from(schema.pricingPlans).where(eq(schema.pricingPlans.isDefault, true)).limit(1);
  if (plan) return plan;
  const [any] = await db.select().from(schema.pricingPlans).limit(1);
  return any ?? null;
}

export type CalculatorInput = {
  areaM2: number;
  durationMonths: number;
  numberOfProducts: number;
  numberOfCartons: number;
  needsInventoryManagement: boolean;
  needsPicking: boolean;
  needsPacking: boolean;
  needsShipping: boolean;
  estimatedOrdersPerMonth: number;
};

/** Pure function — no DB writes. Given a pricing plan + inputs, returns an itemized monthly estimate. */
export function estimateMonthlyCost(plan: typeof schema.pricingPlans.$inferSelect, input: CalculatorInput) {
  const items: { label: string; amount: number }[] = [];

  const storageCost = Math.max(input.areaM2 * plan.pricePerM2, plan.minMonthlyFee);
  items.push({ label: "رسوم التخزين الشهرية", amount: round2(storageCost) });

  if (input.numberOfCartons > 0 && plan.pricePerCarton) {
    items.push({ label: `رسوم كراتين — ${input.numberOfCartons} كرتونة`, amount: round2(input.numberOfCartons * plan.pricePerCarton) });
  }
  if (input.needsInventoryManagement) {
    items.push({ label: "إدارة المخزون الرقمية", amount: 300 });
  }
  if (input.needsPicking) {
    items.push({ label: `تجهيز الطلبات (Picking) — ${input.estimatedOrdersPerMonth} طلب/شهر`, amount: round2(input.estimatedOrdersPerMonth * (plan.pickingFee ?? 0)) });
  }
  if (input.needsPacking) {
    items.push({ label: `التغليف (Packing) — ${input.estimatedOrdersPerMonth} طلب/شهر`, amount: round2(input.estimatedOrdersPerMonth * (plan.packingFee ?? 0)) });
  }
  if (input.needsShipping) {
    items.push({ label: `مصاريف مناولة الشحن — ${input.estimatedOrdersPerMonth} طلب/شهر`, amount: round2(input.estimatedOrdersPerMonth * (plan.shippingHandlingFee ?? 0)) });
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalForDuration = subtotal * Math.max(1, input.durationMonths);

  return { items, monthlySubtotal: round2(subtotal), durationMonths: input.durationMonths, totalForDuration: round2(totalForDuration) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}