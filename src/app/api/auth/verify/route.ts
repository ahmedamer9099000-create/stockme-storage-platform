import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/auth/verify?token=... — clicked from the email link. Marks the
// account verified and redirects to /login with a status flag (no auto
// session: the person still has to log in explicitly after verifying).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?verify=missing", url));

  const [user] = await db.select().from(schema.users).where(eq(schema.users.verificationToken, token)).limit(1);
  if (!user) return NextResponse.redirect(new URL("/login?verify=invalid", url));

  await db.update(schema.users).set({ emailVerified: true, verificationToken: null }).where(eq(schema.users.id, user.id));

  return NextResponse.redirect(new URL("/login?verify=success", url));
}