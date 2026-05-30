// src/lib/error-handler.ts
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_ERROR",
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
    this.name = "RateLimitError";
  }
}

/**
 * Standard error response format
 */
export function handleApiError(error: unknown): { error: string; code?: string; details?: any } {
  if (error instanceof AppError) {
    logger.error(error.message, error, { code: error.code });
    return {
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    logger.error(error.message, error);
    return { error: error.message };
  }

  logger.error("Unknown error", error);
  return { error: "An unexpected error occurred" };
}

/**
 * Wrap async functions with standardized error handling
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const errorResponse = handleApiError(error);
    if (context) {
      logger.error(`Error in ${context}`, error);
    }
    return errorResponse;
  }
}
