import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: () => new Map(),
}));

import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  generateSecureToken,
  maskSensitiveData,
} from "@/lib/security";

// ── sanitizeInput ─────────────────────────────────────────
describe("sanitizeInput", () => {
  it("escapes HTML angle brackets", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(sanitizeInput("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes double quotes", () => {
    expect(sanitizeInput('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it("returns plain text unchanged", () => {
    expect(sanitizeInput("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });
});

// ── isValidEmail ──────────────────────────────────────────
describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test+tag@domain.co")).toBe(true);
    expect(isValidEmail("a@b.c")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("noatsign")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});

// ── isValidPhone ──────────────────────────────────────────
describe("isValidPhone", () => {
  it("accepts valid phone formats", () => {
    expect(isValidPhone("+977-9841234567")).toBe(true);
    expect(isValidPhone("9841234567")).toBe(true);
    expect(isValidPhone("+1 (555) 123-4567")).toBe(true);
    expect(isValidPhone("01-4123456")).toBe(true);
  });

  it("rejects invalid phones", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("12@34")).toBe(false);
  });
});

// ── generateSecureToken ───────────────────────────────────
describe("generateSecureToken", () => {
  it("generates token of default length", () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(32);
  });

  it("generates token of custom length", () => {
    expect(generateSecureToken(16)).toHaveLength(16);
    expect(generateSecureToken(64)).toHaveLength(64);
  });

  it("contains only alphanumeric characters", () => {
    const token = generateSecureToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateSecureToken()));
    expect(tokens.size).toBe(20);
  });
});

// ── maskSensitiveData ─────────────────────────────────────
describe("maskSensitiveData", () => {
  it("masks with default visible chars", () => {
    expect(maskSensitiveData("secretkey123")).toBe("secr********");
  });

  it("masks with custom visible chars", () => {
    expect(maskSensitiveData("abcdef", 2)).toBe("ab****");
  });

  it("fully masks short strings", () => {
    expect(maskSensitiveData("abc", 4)).toBe("***");
  });

  it("fully masks single char with visibleChars=4", () => {
    expect(maskSensitiveData("x", 4)).toBe("*");
  });

  it("handles empty string", () => {
    expect(maskSensitiveData("", 4)).toBe("");
  });
});
