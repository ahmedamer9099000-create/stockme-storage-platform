import { NextResponse } from "next/server";
import { getFreshUser, SessionUser } from "./auth";

export function ok(data: unknown, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Loads the current session user and checks role. Returns a NextResponse (401/403)
 * to short-circuit with, or the user to proceed with.
 */
export async function requireUser(roles?: SessionUser["role"][]): Promise<SessionUser | NextResponse> {
  const user = await getFreshUser();
  if (!user) return fail("غير مصرح — يجب تسجيل الدخول", 401);
  if (roles && !roles.includes(user.role)) return fail("لا تملك صلاحية الوصول لهذا المورد", 403);
  return user;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
