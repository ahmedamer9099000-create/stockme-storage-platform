import { db, schema } from "@/db";
import { eq, like, or } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { recordMovement } from "@/lib/inventory";
import { z } from "zod";

const CreateProductSchema = z.object({
  customerId: z.number().optional(), // admin only; ignored for CUSTOMER role (forced to own id)
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  minStock: z.number().int().min(0).default(0),
  unitWeightKg: z.number().optional(),
  unitDimensions: z.string().optional(),
  imageUrl: z.string().optional(),
  initialQuantity: z.number().int().min(0).default(0),
  spaceM2: z.number().min(0).default(0),
});

// GET /api/products?search=&customerId= — list, scoped by role
export async function GET(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const customerIdParam = searchParams.get("customerId");

  let rows = await db.select().from(schema.products);

  if (user.role === "CUSTOMER") {
    rows = rows.filter((p) => p.customerId === user.customerId);
  } else if (customerIdParam) {
    rows = rows.filter((p) => p.customerId === Number(customerIdParam));
  }

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.barcode ?? "").toLowerCase().includes(s));
  }

  return ok(rows);
}

// POST /api/products — create a product. Customers create for themselves; staff can specify customerId.
export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

  const data = parsed.data;
  const customerId = user.role === "CUSTOMER" ? user.customerId! : data.customerId;
  if (!customerId) return fail("customerId مطلوب");

  // Customer-submitted products require admin approval before they enter inventory;
  // staff (ADMIN/SUPER_ADMIN) can add products directly.
  const isCustomerSubmission = user.role === "CUSTOMER";

  const [product] = await db
    .insert(schema.products)
    .values({
      customerId,
      sku: data.sku,
      barcode: data.barcode,
      name: data.name,
      category: data.category,
      description: data.description,
      minStock: data.minStock,
      unitWeightKg: data.unitWeightKg,
      unitDimensions: data.unitDimensions,
      imageUrl: data.imageUrl,
      spaceM2: data.spaceM2,
      quantity: 0,
      approvalStatus: isCustomerSubmission ? "pending" : "approved",
      requestedInitialQty: isCustomerSubmission ? data.initialQuantity : undefined,
    })
    .returning();

  if (!isCustomerSubmission && data.initialQuantity > 0) {
    await recordMovement({
      productId: product.id,
      type: "IN",
      quantity: data.initialQuantity,
      userId: user.id,
      reason: "رصيد افتتاحي عند إنشاء المنتج",
      referenceType: "manual",
    });
  }

  const [fresh] = await db.select().from(schema.products).where(eq(schema.products.id, product.id));
  return ok(fresh, 201);
}
