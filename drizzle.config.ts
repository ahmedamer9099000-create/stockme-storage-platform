import type { Config } from "drizzle-kit";

// Only used for `drizzle-kit generate` (turns schema.ts into SQL migration files
// under ./drizzle). Applying those migrations to D1 happens separately via
// `wrangler d1 migrations apply` (see package.json db:migrate:local/remote),
// so no live DB connection/credentials are needed here.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
