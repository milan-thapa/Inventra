import { describe, it, expect } from "vitest";
import { getNepaliDate, formatBS } from "@/lib/nepali-date";

describe("getNepaliDate", () => {
  it("returns a BS string for a 2023 date", () => {
    const result = getNepaliDate(new Date(2023, 5, 15));
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect(result).toContain("BS");
  });

  it("returns a BS string for a 2024 date", () => {
    const result = getNepaliDate(new Date(2024, 0, 1));
    expect(result).not.toBeNull();
    expect(result).toContain("BS");
  });

  it("returns null for dates outside supported range", () => {
    expect(getNepaliDate(new Date(2000, 0, 1))).toBeNull();
    expect(getNepaliDate(new Date(2050, 0, 1))).toBeNull();
  });

  it("includes year offset (+56) from AD year", () => {
    const result = getNepaliDate(new Date(2023, 6, 10));
    expect(result).toContain("2079");
  });
});

describe("formatBS", () => {
  it("returns BS string for supported date", () => {
    const result = formatBS(new Date(2024, 3, 10));
    expect(typeof result).toBe("string");
    expect(result).toContain("BS");
  });

  it("falls back to locale date for unsupported date", () => {
    const result = formatBS(new Date(2000, 0, 1));
    expect(typeof result).toBe("string");
    expect(result).not.toContain("BS");
  });
});
