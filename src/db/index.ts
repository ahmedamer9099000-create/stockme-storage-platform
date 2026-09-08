import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Cloudflare Workers hands us the D1 binding per-request via the runtime
 * context (there's no persistent global connection like a Node process).
 * We cache the drizzle instance per isolate to avoid re-wrapping it on
 * every call within the same request/isolate lifetime.
 */
let cached: DrizzleD1Database<typeof schema> | null = null;

export function getDb(): DrizzleD1Database<typeof schema> {
  if (cached) return cached;
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error(
      "D1 binding 'DB' غير موجود. تأكد أن wrangler.jsonc فيه d1_databases مربوطة باسم binding = DB."
    );
  }
  cached = drizzle(env.DB, { schema });
  return cached;
}

// Kept as `db` for compatibility with existing call sites (`import { db } from "@/db"`).
// Accessing any property lazily resolves the real per-request D1 connection.
export const db = new Proxy({} as DrizzleD1Database<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export * as schema from "./schema";
