// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

// ── Tailwind class merger ────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recursively converts Prisma Decimal objects to numbers for client-side serialization.
 * Next.js Server Components cannot pass Decimal objects directly to Client Components.
 */
export function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(item => serialize(item)) as any;
  }

  if (data instanceof Date) return data;

  if (typeof data === "object") {
    // Check if it's a Prisma Decimal (has d, e, s properties or toNumber method)
    if ((data as any).toNumber && typeof (data as any).toNumber === "function") {
      return (data as any).toNumber();
    }

    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serialize(data[key]);
      }
    }
    return result as T;
  }

  return data;
}

// ── Currency formatting ──────────────────────────────────
export function formatCurrency(
  amount: number | string,
  currency = "Rs.",
  position: "start" | "end" = "start",
  numberFormat: "indian" | "international" = "indian"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0`;

  let formatted: string;

  if (numberFormat === "indian") {
    // Indian number format: 1,00,000
    const parts = Math.abs(num).toFixed(2).split(".");
    const intPart = parts[0];
    const decPart = parts[1];

    let result = "";
    if (intPart.length > 3) {
      result = intPart.slice(-3);
      const remaining = intPart.slice(0, -3);
      for (let i = remaining.length; i > 0; i -= 2) {
        result = remaining.slice(Math.max(0, i - 2), i) + "," + result;
      }
    } else {
      result = intPart;
    }
    formatted = `${result}.${decPart}`;
  } else {
    formatted = Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const sign = num < 0 ? "-" : "";
  return position === "start"
    ? `${sign}${currency} ${formatted}`
    : `${sign}${formatted} ${currency}`;
}

// ── Short currency (no decimals) ─────────────────────────
export function formatCurrencyShort(amount: number | string, currency = "Rs."): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0`;

  if (Math.abs(num) >= 100000) {
    return `${currency} ${(num / 100000).toFixed(1)}L`;
  }
  if (Math.abs(num) >= 1000) {
    return `${currency} ${(num / 1000).toFixed(1)}k`;
  }
  return `${currency} ${Math.abs(num).toFixed(0)}`;
}

// ── Date formatting ──────────────────────────────────────
export function formatDate(date: Date | string, fmt = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

// ── Nepali BS months (for display) ───────────────────────
export const BS_MONTHS = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

export const BS_MONTHS_SHORT = [
  "Bai", "Jes", "Ash", "Shr", "Bha", "Asw",
  "Kar", "Man", "Pou", "Mag", "Fal", "Cha",
];

// Simple AD→BS conversion (approximate, for display only)
export function adToBs(adDate: Date): { year: number; month: number; day: number } {
  // Reference: 1944-01-01 AD = 2000-09-17 BS
  const adBase = new Date(1944, 0, 1);
  const bsBase = { year: 2000, month: 9, day: 17 };

  const diffDays = Math.floor(
    (adDate.getTime() - adBase.getTime()) / (1000 * 60 * 60 * 24)
  );

  // BS month lengths (approximate - varies by year)
  const bsMonthDays = [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30];

  let year = bsBase.year;
  let month = bsBase.month - 1; // 0-indexed
  let day = bsBase.day;
  let remaining = diffDays;

  while (remaining > 0) {
    const daysInMonth = bsMonthDays[month];
    const daysLeft = daysInMonth - day + 1;

    if (remaining < daysLeft) {
      day += remaining;
      remaining = 0;
    } else {
      remaining -= daysLeft;
      day = 1;
      month++;
      if (month >= 12) {
        month = 0;
        year++;
      }
    }
  }

  return { year, month: month + 1, day };
}

export function formatBsDate(date: Date): string {
  const bs = adToBs(date);
  return `${bs.year} ${BS_MONTHS_SHORT[bs.month - 1]} ${String(bs.day).padStart(2, "0")}`;
}

// ── Avatar initials + color ───────────────────────────────
const AVATAR_COLORS = [
  "bg-emerald-600", "bg-blue-600", "bg-purple-600",
  "bg-orange-600", "bg-pink-600", "bg-teal-600",
  "bg-red-600", "bg-indigo-600", "bg-yellow-600",
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Number helpers ────────────────────────────────────────
export function toDecimal(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "object" && "toNumber" in (value as object)) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

// ── Truncate text ─────────────────────────────────────────
export function truncate(str: string, maxLen = 30): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

// ── Generate receipt number ───────────────────────────────
export function padNumber(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

// ── Debounce ──────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
