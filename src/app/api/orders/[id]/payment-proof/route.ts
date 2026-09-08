import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";

// POST /api/orders/[id]/payment-proof — customer uploads an Instapay transfer
// screenshot. Stored directly in D1 as a base64 data URI (no external storage
// needed) since these screenshots are small.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const orderId = Number(id);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) return fail("الطلب غير موجود", 404);
  if (order.customerId !== user.customerId) return fail("غير مصرح لك بهذا الطلب", 403);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) return fail("لم يتم إرفاق صورة");
  if (!file.type.startsWith("image/")) return fail("الملف المرفوع يجب أن يكون صورة");
  if (file.size > 1.5 * 1024 * 1024) return fail("حجم الصورة كبير جدًا (الحد الأقصى 1.5 ميجابايت)");

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await db
    .update(schema.orders)
    .set({ paymentProofUrl: dataUri, paymentMethod: "instapay" })
    .where(eq(schema.orders.id, orderId));

  return ok({ uploaded: true });
}