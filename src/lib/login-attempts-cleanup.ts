import { lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

const DAY_SECONDS = 24 * 60 * 60;
const RETENTION_DAYS = 30;

// Runs once a day via the same Cloudflare Cron Trigger as the storage expiry
// check. Deletes login/register attempt rows older than RETENTION_DAYS so
// the login_attempts table (written to on every login/register call) does
// not grow unbounded â€” rate limiting only ever looks at the last 15
// minutes/1 hour anyway, so anything older has no further use.
export async function cleanupOldLoginAttempts(db: DrizzleD1Database<typeof schema>) {
  const cutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS * DAY_SECONDS;

  const result = await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.createdAt, cutoff));

  return { deletedCount: result.meta?.changes ?? 0 };
}