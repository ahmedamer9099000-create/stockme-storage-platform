import { db, schema } from "@/db";
import { and, eq, gte, or } from "drizzle-orm";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minutes

const MAX_REGISTER_ATTEMPTS = 3;
const REGISTER_WINDOW_SECONDS = 60 * 60; // 1 hour

/** Reads the client IP from Cloudflare's edge header (falls back to a constant for local/dev). */
export function getClientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
}

/**
 * Returns true if this email OR this IP has hit the failed-attempt limit within
 * the time window — i.e. login should be blocked right now.
 */
export async function isLoginRateLimited(email: string, ip: string): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / 1000) - LOGIN_WINDOW_SECONDS;

  const recentFailures = await db
    .select()
    .from(schema.loginAttempts)
    .where(
      and(
        eq(schema.loginAttempts.type, "login"),
        eq(schema.loginAttempts.success, false),
        gte(schema.loginAttempts.createdAt, windowStart),
        or(eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.ip, ip))
      )
    );

  return recentFailures.length >= MAX_LOGIN_ATTEMPTS;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await db.insert(schema.loginAttempts).values({ email, ip, success, type: "login" });
}

/**
 * Returns true if this IP has created too many accounts recently — blocks
 * mass automated registration from a single source. Counts ALL register
 * attempts from this IP (successful or not), unlike login which only counts
 * failures, since every successful registration is itself the thing being limited.
 */
export async function isRegisterRateLimited(ip: string): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / 1000) - REGISTER_WINDOW_SECONDS;

  const recentAttempts = await db
    .select()
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.type, "register"), eq(schema.loginAttempts.ip, ip), gte(schema.loginAttempts.createdAt, windowStart)));

  return recentAttempts.length >= MAX_REGISTER_ATTEMPTS;
}

export async function recordRegisterAttempt(ip: string, success: boolean) {
  await db.insert(schema.loginAttempts).values({ email: "", ip, success, type: "register" });
}