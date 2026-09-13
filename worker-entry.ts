import worker from "./.open-next/worker.js";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./src/db/schema";
import { runStorageExpiryCheck } from "./src/lib/storage-expiry-check";

// Re-export everything else OpenNext's worker exposes (queue consumers,
// durable object classes for tag caching, etc.) so nothing else breaks.
export * from "./.open-next/worker.js";

export default {
  ...worker,

  // Cloudflare invokes this directly on the schedule defined in
  // wrangler.jsonc's `triggers.crons` — it's a separate event type from
  // `fetch`, so it does NOT go through OpenNext's request pipeline and
  // getCloudflareContext() would have nothing to read here. We build the
  // drizzle instance straight from the `env` Cloudflare hands us instead.
  async scheduled(controller: any, env: any, ctx: any) {
    const db = drizzle(env.DB, { schema });
    ctx.waitUntil(
      runStorageExpiryCheck(db)
        .then((result) => {
          console.log("[storage-expiry-check] done", result);
        })
        .catch((err) => {
          console.error("[storage-expiry-check] failed", err);
        })
    );
  },
};
