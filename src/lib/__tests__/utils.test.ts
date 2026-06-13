import { describe, it, expect, vi } from "vitest";
import {
  cn,
  serialize,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  BS_MONTHS,
  BS_MONTHS_SHORT,
  adToBs,
  formatBsDate,
  getInitials,
  getAvatarColor,
  toDecimal,
  truncate,
  padNumber,
  debounce,
} from "@/lib/utils";

// ── cn ────────────────────────────────────────────────────
describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

// ── serialize ─────────────────────────────────────────────
describe("serialize", () => {
  it("returns null/undefined as-is", () => {
    expect(serialize(null)).toBeNull();
    expect(serialize(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(serialize(42)).toBe(42);
    expect(serialize("hello")).toBe("hello");
    expect(serialize(true)).toBe(true);
  });

  it("returns Date unchanged", () => {
    const d = new Date("2024-01-01");
    expect(serialize(d)).toBe(d);
  });

  it("converts objects with toNumber()", () => {
    const decimal = { toNumber: () => 99.5 };
    expect(serialize(decimal)).toBe(99.5);
  });

  it("recursively serializes nested objects", () => {
    const input = {
      name: "test",
      amount: { toNumber: () => 100 },
      nested: { value: { toNumber: () => 50 } },
    };
    expect(serialize(input)).toEqual({
      name: "test",
      amount: 100,
      nested: { value: 50 },
    });
  });

  it("serializes arrays", () => {
    const input = [{ toNumber: () => 1 }, { toNumber: () => 2 }];
    expect(serialize(input)).toEqual([1, 2]);
  });
});

// ── formatCurrency ────────────────────────────────────────
describe("formatCurrency", () => {
  it("formats with default Indian style", () => {
    expect(formatCurrency(1000)).toBe("Rs. 1,000.00");
  });

  it("formats large number in Indian style (lakh grouping)", () => {
    expect(formatCurrency(100000)).toBe("Rs. 1,00,000.00");
  });

  it("formats with international style", () => {
    expect(formatCurrency(100000, "Rs.", "start", "international")).toBe(
      "Rs. 100,000.00"
    );
  });

  it("handles string input", () => {
    expect(formatCurrency("2500")).toBe("Rs. 2,500.00");
  });

  it("handles NaN", () => {
    expect(formatCurrency("abc")).toBe("Rs. 0");
  });

  it("handles negative numbers", () => {
    const result = formatCurrency(-5000);
    expect(result).toContain("-");
    expect(result).toContain("5,000.00");
  });

  it("places currency at end", () => {
    expect(formatCurrency(100, "$", "end")).toBe("100.00 $");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("Rs. 0.00");
  });

  it("formats small amounts", () => {
    expect(formatCurrency(5.5)).toBe("Rs. 5.50");
  });
});

// ── formatCurrencyShort ───────────────────────────────────
describe("formatCurrencyShort", () => {
  it("formats lakhs", () => {
    expect(formatCurrencyShort(500000)).toBe("Rs. 5.0L");
  });

  it("formats thousands", () => {
    expect(formatCurrencyShort(5000)).toBe("Rs. 5.0k");
  });

  it("formats small numbers", () => {
    expect(formatCurrencyShort(500)).toBe("Rs. 500");
  });

  it("handles NaN", () => {
    expect(formatCurrencyShort("bad")).toBe("Rs. 0");
  });

  it("handles string input", () => {
    expect(formatCurrencyShort("200000")).toBe("Rs. 2.0L");
  });
});

// ── formatDate ────────────────────────────────────────────
describe("formatDate", () => {
  it("formats Date object with default pattern", () => {
    const d = new Date(2024, 0, 15);
    expect(formatDate(d)).toBe("15 Jan 2024");
  });

  it("formats string date", () => {
    expect(formatDate("2024-06-01")).toContain("2024");
  });

  it("accepts custom format", () => {
    const d = new Date(2024, 5, 15);
    expect(formatDate(d, "yyyy-MM-dd")).toBe("2024-06-15");
  });
});

// ── BS_MONTHS ─────────────────────────────────────────────
describe("BS_MONTHS", () => {
  it("has 12 entries", () => {
    expect(BS_MONTHS).toHaveLength(12);
    expect(BS_MONTHS_SHORT).toHaveLength(12);
  });

  it("starts with Baishakh", () => {
    expect(BS_MONTHS[0]).toBe("Baishakh");
    expect(BS_MONTHS_SHORT[0]).toBe("Bai");
  });
});

// ── adToBs ────────────────────────────────────────────────
describe("adToBs", () => {
  it("converts reference date correctly", () => {
    const ad = new Date(1944, 0, 1);
    const bs = adToBs(ad);
    expect(bs.year).toBe(2000);
    expect(bs.month).toBe(9);
    expect(bs.day).toBe(17);
  });

  it("returns an object with year, month, day", () => {
    const bs = adToBs(new Date(2024, 5, 15));
    expect(bs).toHaveProperty("year");
    expect(bs).toHaveProperty("month");
    expect(bs).toHaveProperty("day");
    expect(bs.month).toBeGreaterThanOrEqual(1);
    expect(bs.month).toBeLessThanOrEqual(12);
  });
});

// ── formatBsDate ──────────────────────────────────────────
describe("formatBsDate", () => {
  it("returns a formatted BS date string", () => {
    const result = formatBsDate(new Date(2024, 5, 15));
    expect(typeof result).toBe("string");
    expect(result).toMatch(/^\d{4}/);
  });
});

// ── getInitials ───────────────────────────────────────────
describe("getInitials", () => {
  it("gets two-letter initials", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("truncates to two characters", () => {
    expect(getInitials("A B C D")).toBe("AB");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

// ── getAvatarColor ────────────────────────────────────────
describe("getAvatarColor", () => {
  it("returns a hex color string", () => {
    expect(getAvatarColor("test")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is deterministic for the same input", () => {
    expect(getAvatarColor("Alice")).toBe(getAvatarColor("Alice"));
  });

  it("varies for different inputs", () => {
    const colors = new Set(["a", "b", "c", "d", "e"].map(getAvatarColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});

// ── toDecimal ─────────────────────────────────────────────
describe("toDecimal", () => {
  it("returns 0 for null/undefined", () => {
    expect(toDecimal(null)).toBe(0);
    expect(toDecimal(undefined)).toBe(0);
  });

  it("converts object with toNumber", () => {
    expect(toDecimal({ toNumber: () => 42 })).toBe(42);
  });

  it("converts number", () => {
    expect(toDecimal(3.14)).toBe(3.14);
  });

  it("converts numeric string", () => {
    expect(toDecimal("100")).toBe(100);
  });

  it("returns 0 for NaN", () => {
    expect(toDecimal("abc")).toBe(0);
  });
});

// ── truncate ──────────────────────────────────────────────
describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("a".repeat(50))).toBe("a".repeat(30) + "...");
  });

  it("does not truncate short strings", () => {
    expect(truncate("short")).toBe("short");
  });

  it("respects custom maxLen", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncate("abc", 3)).toBe("abc");
  });
});

// ── padNumber ─────────────────────────────────────────────
describe("padNumber", () => {
  it("pads single digit", () => {
    expect(padNumber(1)).toBe("001");
  });

  it("pads to custom width", () => {
    expect(padNumber(5, 5)).toBe("00005");
  });

  it("does not truncate larger numbers", () => {
    expect(padNumber(12345)).toBe("12345");
  });
});

// ── debounce ──────────────────────────────────────────────
describe("debounce", () => {
  it("delays execution", async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("resets timer on subsequent calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
