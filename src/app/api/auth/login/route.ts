import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";
import { getClientIp, isLoginRateLimited, recordLoginAttempt } from "@/lib/rate-limit";
import { z } from "zod";
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return fail("البريد الإلكتروني وكلمة المرور مطلوبان");
  const { email, password } = parsed.data;
  const ip = getClientIp(req);
  // Brute-force guard: block if this email OR this IP has racked up too many
  // failed attempts recently, before touching the password hash at all.
  if (await isLoginRateLimited(email, ip)) {
    return fail("عدد كبير من محاولات الدخول الفاشلة. حاول مرة أخرى بعد 15 دقيقة.", 429);
  }
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || !user.isActive) {
    await recordLoginAttempt(email, ip, false);
    return fail("بيانات الدخول غير صحيحة", 401);
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordLoginAttempt(email, ip, false);
    return fail("بيانات الدخول غير صحيحة", 401);
  }
  if (!user.emailVerified) {
    // بيانات الدخول صحيحة هنا -- دي مش محاولة تخمين باسورد، فمينفعش تتحسب ضمن عداد الـ brute-force.
    return fail("لازم تأكّد بريدك الإلكتروني أولًا. افحص صندوق الوارد (أو الرسائل غير المرغوبة) عندك.", 403);
  }
  await recordLoginAttempt(email, ip, true);
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
  };
  await setSessionCookie(sessionUser);
  return ok(sessionUser);
}