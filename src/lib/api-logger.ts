// src/lib/api-logger.ts
/**
 * Request/response logging middleware for API routes
 * Provides visibility into API performance and errors
 */

import { logger } from "./logger";

export interface ApiLogContext {
  userId?: string;
  profileId?: string;
  action?: string;
  method?: string;
  path?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

export function logApiRequest(context: ApiLogContext) {
  logger.info("API Request", {
    method: context.method,
    path: context.path,
    userId: context.userId,
    profileId: context.profileId,
    action: context.action,
  });
}

export function logApiResponse(context: ApiLogContext) {
  const logLevel = context.statusCode && context.statusCode >= 400 ? "error" : "info";
  
  if (logLevel === "error") {
    logger.error("API Response Error", context.error, {
      method: context.method,
      path: context.path,
      userId: context.userId,
      profileId: context.profileId,
      statusCode: context.statusCode,
      duration: context.duration,
    });
  } else {
    logger.info("API Response", {
      method: context.method,
      path: context.path,
      userId: context.userId,
      profileId: context.profileId,
      statusCode: context.statusCode,
      duration: context.duration,
    });
  }
}

export function withApiLogging<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context: { action: string }
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const logContext: ApiLogContext = {
      action: context.action,
      method: "SERVER_ACTION",
    };

    try {
      logApiRequest(logContext);
      const result = await handler(...args);
      
      logApiResponse({
        ...logContext,
        duration: Date.now() - startTime,
        statusCode: result?.error ? 500 : 200,
      });

      return result;
    } catch (error) {
      logApiResponse({
        ...logContext,
        duration: Date.now() - startTime,
        statusCode: 500,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }) as T;
}
