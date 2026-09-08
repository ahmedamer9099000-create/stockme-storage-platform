import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { requireUser, ok, isResponse } from "@/lib/api-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  await db.update(schema.notifications).set({ isRead: true }).where(and(eq(schema.notifications.id, Number(id)), eq(schema.notifications.userId, user.id)));
  return ok({ read: true });
}
