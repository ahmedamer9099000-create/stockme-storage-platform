import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser, ok, fail, isResponse } from "@/lib/api-helpers";
import { z } from "zod";

const ReportSchema = z.object({ issue: z.enum(["missing", "damaged"]), notes: z.string().optional() });

// POST /api/picking-tasks/[id]/report — "Report Missing" / "Report Damaged" buttons in the picking UI
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN", "WAREHOUSE_EMPLOYEE"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const taskId = Number(id);

  const [task] = await db.select().from(schema.pickingTasks).where(eq(schema.pickingTasks.id, taskId));
  if (!task) return fail("مهمة التجهيز غير موجودة", 404);
  if (task.status !== "pending") return fail("تم التعامل مع هذه المهمة بالفعل");

  const body = await req.json().catch(() => null);
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صحيحة");

  await db
    .update(schema.pickingTasks)
    .set({ status: parsed.data.issue, notes: parsed.data.notes, assignedTo: user.id, completedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.pickingTasks.id, taskId));

  // surface it — an admin needs to resolve this before the order can complete
  const admins = await db.select().from(schema.users).where(eq(schema.users.role, "ADMIN"));
  for (const admin of admins) {
    await db.insert(schema.notifications).values({
      userId: admin.id,
      type: "picking_issue",
      title: parsed.data.issue === "missing" ? "صنف مفقود أثناء التجهيز" : "صنف تالف أثناء التجهيز",
      message: `تم الإبلاغ عن مشكلة في مهمة التجهيز رقم ${taskId} الخاصة بالطلب رقم ${task.orderId}.`,
    });
  }

  return ok({ reported: true });
}
