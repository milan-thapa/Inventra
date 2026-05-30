// src/lib/logger-producer.ts
import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Child logger with context
export function createLogger(context: string) {
  return logger.child({ context });
}

// Log levels
export const log = {
  info: (message: string, meta?: any) => logger.info({ ...meta }, message),
  warn: (message: string, meta?: any) => logger.warn({ ...meta }, message),
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(
      {
        ...meta,
        error: error
          ? {
              message: error.message,
              stack: isDevelopment ? error.stack : undefined,
              name: error.name,
            }
          : undefined,
      },
      message
    ),
  debug: (message: string, meta?: any) => logger.debug({ ...meta }, message),
};
