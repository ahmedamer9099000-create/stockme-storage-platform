import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { requireUser, ok, isResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  // id as tiebreaker: see the comment in api/products/[id]/movements/route.ts — SQLite's
  // 1-second timestamp resolution means createdAt alone doesn't reliably order same-second rows.
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(desc(schema.notifications.createdAt), desc(schema.notifications.id));
  return ok(rows);
}
