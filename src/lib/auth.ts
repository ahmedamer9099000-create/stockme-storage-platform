import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "session_token";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "WAREHOUSE_EMPLOYEE" | "CUSTOMER";
  customerId: number | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Reads and verifies the session cookie. Returns null if absent/invalid — never throws. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Re-reads the user fresh from DB (use when isActive/role may have changed since token issue). */
export async function getFreshUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, session.id)).limit(1);
  if (!u || !u.isActive) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, customerId: u.customerId };
}

export function requireRole(user: SessionUser | null, roles: SessionUser["role"][]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
