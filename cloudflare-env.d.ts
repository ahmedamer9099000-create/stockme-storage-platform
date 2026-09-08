// Typed shape of the bindings/vars declared in wrangler.jsonc.
// Used by getCloudflareContext<CloudflareEnv>() throughout the app.
interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}
