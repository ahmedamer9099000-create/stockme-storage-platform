import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { ok, fail } from "@/lib/api-helpers";
import { getClientIp, isRegisterRateLimited, recordRegisterAttempt } from "@/lib/rate-limit";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[a-zA-Z]/, "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل"),
  phone: z.string().optional(),
  companyName: z.string().min(2),
  businessType: z.string().optional(),
  whatsapp: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Blocks mass automated account creation from a single source: max 3
  // registrations per IP per hour, regardless of the email used each time.
  if (await isRegisterRateLimited(ip)) {
    return fail("تم إنشاء عدد كبير من الحسابات من هذا الجهاز مؤخرًا. حاول مرة أخرى بعد ساعة.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
  const { name, email, password, phone, companyName, businessType, whatsapp } = parsed.data;

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    await recordRegisterAttempt(ip, false);
    return fail("البريد الإلكتروني مستخدم بالفعل", 409);
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomUUID();

  // NOTE (D1): no interactive db.transaction() on Cloudflare D1 — these three
  // writes run sequentially instead. A failure between them could leave a
  // customer row without its linked user; acceptable risk for registration.
  const [customer] = await db
    .insert(schema.customers)
    .values({ companyName, businessType, phone, whatsapp, status: "active" })
    .returning();

  const [user] = await db
    .insert(schema.users)
    .values({
      name,
      email,
      passwordHash,
      phone,
      role: "CUSTOMER",
      customerId: customer.id,
      emailVerified: false,
      verificationToken,
    })
    .returning();

  await db.update(schema.customers).set({ userId: user.id }).where(eq(schema.customers.id, customer.id));

  await recordRegisterAttempt(ip, true);

  const verifyUrl = `https://storage-platform.stockme-eg.workers.dev/api/auth/verify?token=${verificationToken}`;
  await sendEmail({
    to: email,
    subject: "أكّد بريدك الإلكتروني",
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
        <h2>مرحبًا ${name} 👋</h2>
        <p>شكرًا لتسجيلك في منصتنا. لازم تأكّد بريدك الإلكتروني أولًا عشان تقدر تسجّل الدخول.</p>
        <p><a href="${verifyUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">تأكيد البريد الإلكتروني</a></p>
        <p style="color:#666;font-size:12px;">لو الرابط مايشتغلش، انسخ الرابط ده والصقه في المتصفح:<br>${verifyUrl}</p>
      </div>
    `,
  });

  return ok({ message: "تم إنشاء الحساب. افحص بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول." }, 201);
}