import { db, schema } from "@/db";

/**
 * Records a sensitive administrative action into the audit_logs table.
 * Never throws — an audit-write failure should never block the underlying
 * business operation it's describing.
 */
export async function logAudit(params: {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string;
}) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
    });
  } catch (err) {
    console.error("logAudit failed:", err);
  }
}