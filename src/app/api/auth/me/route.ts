import { getFreshUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";

export async function GET() {
  const user = await getFreshUser();
  if (!user) return fail("غير مسجل الدخول", 401);
  return ok(user);
}
