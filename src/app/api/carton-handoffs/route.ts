import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const HandoffSchema = z.object({
  customerId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  cartonCount: z.number().int().positive(),
  spaceFreedM2: z.number().min(0).default(0),
  courier: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/carton-handoffs — records handing already-packed cartons to a
// courier directly from storage (not tied to an Order/Picking/Packing flow).
// Frees up the customer's storage allocation by the given space.
export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = HandoffSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, parsed.data.customerId));
  if (!customer) return fail("العميل غير موجود", 404);

  const [handoff] = await db
    .insert(schema.cartonHandoffs)
    .values({
      customerId: parsed.data.customerId,
      warehouseId: parsed.data.warehouseId,
      cartonCount: parsed.data.cartonCount,
      spaceFreedM2: parsed.data.spaceFreedM2,
      courier: parsed.data.courier,
      notes: parsed.data.notes,
      createdBy: user.id,
    })
    .returning();

  if (parsed.data.spaceFreedM2 > 0) {
    const [allocation] = await db
      .select()
      .from(schema.storageAllocations)
      .where(
        and(
          eq(schema.storageAllocations.customerId, parsed.data.customerId),
          eq(schema.storageAllocations.warehouseId, parsed.data.warehouseId),
          eq(schema.storageAllocations.status, "active")
        )
      );

    if (allocation) {
      const newUsed = Math.max(allocation.usedM2 - parsed.data.spaceFreedM2, 0);
      await db.update(schema.storageAllocations).set({ usedM2: newUsed }).where(eq(schema.storageAllocations.id, allocation.id));
    }
  }

  if (customer.userId) {
    await db.insert(schema.notifications).values({
      userId: customer.userId,
      type: "cartons_handed_off",
      title: "تم تسليم كراتينك",
      message: `تم تسليم ${parsed.data.cartonCount} كرتونة${parsed.data.courier ? ` إلى ${parsed.data.courier}` : ""}.`,
    });

    const [customerUser] = await db.select().from(schema.users).where(eq(schema.users.id, customer.userId));
    if (customerUser?.email) {
      await sendEmail({
        to: customerUser.email,
        subject: `تم تسليم كراتينك (${parsed.data.cartonCount} كرتونة)`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
            <h2>تم تسليم كراتينك ✅</h2>
            <p>مرحبًا ${customer.companyName}،</p>
            <p>تم تسليم <strong>${parsed.data.cartonCount}</strong> كرتونة من مخزونك${parsed.data.courier ? ` إلى <strong>${parsed.data.courier}</strong>` : ""}.</p>
            ${parsed.data.notes ? `<p>ملاحظات: ${parsed.data.notes}</p>` : ""}
          </div>
        `,
      });
    }
  }

  return ok(handoff, 201);
}