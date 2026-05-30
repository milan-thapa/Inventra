// src/lib/audit-logger.ts
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuditAction = 
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "EXPORT"
  | "LOGIN"
  | "LOGOUT"
  | "PROFILE_SWITCH"
  | "SETTINGS_CHANGE";

export type AuditResource = 
  | "SALE"
  | "PURCHASE"
  | "PARTY"
  | "ITEM"
  | "EXPENSE"
  | "INCOME"
  | "PAYMENT"
  | "QUOTATION"
  | "RETURN"
  | "PROFILE"
  | "SETTINGS"
  | "USER";

interface AuditLogData {
  userId: string;
  profileId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log audit trail for sensitive operations
 */
export async function logAuditEvent(data: AuditLogData) {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      logger.info(`Audit: ${data.action} ${data.resource}`, {
        userId: data.userId,
        profileId: data.profileId,
        resourceId: data.resourceId,
        details: data.details,
      });
    }

    // In production, store in database
    if (process.env.NODE_ENV === "production") {
      await db.auditLog.create({
        data: {
          userId: data.userId,
          profileId: data.profileId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    }
  } catch (error) {
    // Don't throw errors from audit logging to avoid breaking main functionality
    logger.error("Failed to log audit event", error, data);
  }
}

/**
 * Helper to get audit context from request
 */
export async function getAuditContext(profileId: string, resourceId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    userId: session.user.id,
    profileId,
    resourceId,
  };
}

/**
 * Wrapper to automatically log audit events for actions
 */
export async function withAuditLogging<T>(
  action: AuditAction,
  resource: AuditResource,
  profileId: string,
  fn: () => Promise<T>,
  resourceId?: string
): Promise<T> {
  const context = await getAuditContext(profileId, resourceId);
  
  try {
    const result = await fn();
    
    await logAuditEvent({
      ...context,
      action,
      resource,
      resourceId,
      details: { status: "success" },
    });
    
    return result;
  } catch (error) {
    await logAuditEvent({
      ...context,
      action,
      resource,
      resourceId,
      details: { 
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
