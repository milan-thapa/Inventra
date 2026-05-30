// src/lib/decimal.ts
/**
 * Decimal serialization utility for safe type conversion
 * Handles Prisma Decimal to Number conversion with proper error handling
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Safely convert Decimal to Number
 * Returns 0 if conversion fails
 */
export function toNumber(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  return 0;
}

/**
 * Safely convert Decimal to Number with optional default
 */
export function toNumberOrDefault(
  value: Decimal | number | string | null | undefined,
  defaultValue: number = 0
): number {
  const result = toNumber(value);
  return result === 0 ? defaultValue : result;
}

/**
 * Convert array of Decimals to Numbers
 */
export function toNumberArray(values: (Decimal | number | string | null | undefined)[]): number[] {
  return values.map(toNumber);
}

/**
 * Serialize an object containing Decimal fields to Number
 * Recursively converts all Decimal values to Numbers
 */
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Decimal) {
    return toNumber(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal) as unknown as T;
  }
  
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDecimal(value);
    }
    return result as T;
  }
  
  return obj;
}

/**
 * Format Decimal as currency string
 */
export function formatCurrency(
  value: Decimal | number | string | null | undefined,
  currency: string = "Rs.",
  locale: string = "en-IN"
): string {
  const num = toNumber(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency === "Rs." ? "INR" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format Decimal as percentage
 */
export function formatPercentage(
  value: Decimal | number | string | null | undefined,
  decimals: number = 2
): string {
  const num = toNumber(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Round Decimal to specified precision
 */
export function roundDecimal(
  value: Decimal | number | string | null | undefined,
  precision: number = 2
): number {
  const num = toNumber(value);
  return Number(num.toFixed(precision));
}
