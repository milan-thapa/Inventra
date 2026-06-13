import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  interpolateTemplate,
  getTemplate,
  renderTemplate,
  getTemplateKeys,
} from "@/lib/notification-templates";

// ── interpolateTemplate ───────────────────────────────────
describe("interpolateTemplate", () => {
  it("replaces single placeholder", () => {
    expect(interpolateTemplate("Hello {{name}}", { name: "Alice" })).toBe(
      "Hello Alice"
    );
  });

  it("replaces multiple placeholders", () => {
    expect(
      interpolateTemplate("{{a}} and {{b}}", { a: "X", b: "Y" })
    ).toBe("X and Y");
  });

  it("replaces repeated placeholders", () => {
    expect(
      interpolateTemplate("{{x}} + {{x}}", { x: "1" })
    ).toBe("1 + 1");
  });

  it("leaves unreplaced placeholders", () => {
    expect(interpolateTemplate("{{missing}}", {})).toBe("{{missing}}");
  });

  it("converts numbers to string", () => {
    expect(interpolateTemplate("Amount: {{amount}}", { amount: 500 })).toBe(
      "Amount: 500"
    );
  });
});

// ── getTemplate ───────────────────────────────────────────
describe("getTemplate", () => {
  it("returns known template", () => {
    const tpl = getTemplate("SALE_CREATED");
    expect(tpl).not.toBeNull();
    expect(tpl!.type).toBe("SALE");
    expect(tpl!.category).toBe("SALES");
  });

  it("returns null for unknown key", () => {
    expect(getTemplate("DOES_NOT_EXIST")).toBeNull();
  });

  it("returns LOW_STOCK_ALERT template", () => {
    const tpl = getTemplate("LOW_STOCK_ALERT");
    expect(tpl).not.toBeNull();
    expect(tpl!.priority).toBe("HIGH");
    expect(tpl!.message).toContain("{{itemName}}");
  });
});

// ── getTemplateKeys ───────────────────────────────────────
describe("getTemplateKeys", () => {
  it("returns an array of strings", () => {
    const keys = getTemplateKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("includes known keys", () => {
    const keys = getTemplateKeys();
    expect(keys).toContain("SALE_CREATED");
    expect(keys).toContain("LOW_STOCK_ALERT");
    expect(keys).toContain("EXPENSE_CREATED");
    expect(keys).toContain("INCOME_RECEIVED");
  });
});

// ── renderTemplate ────────────────────────────────────────
describe("renderTemplate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a sale notification", () => {
    const result = renderTemplate("SALE_CREATED", {
      invoiceNo: "INV-001",
      partyName: "Acme Corp",
      amount: "Rs. 5,000",
      saleId: "sale-123",
    });
    expect(result).not.toBeNull();
    expect(result!.message).toBe(
      "New sale created: Invoice #INV-001 for Acme Corp - Rs. 5,000"
    );
    expect(result!.link).toBe("/sales/sale-123");
    expect(result!.priority).toBe("NORMAL");
  });

  it("sets expiresAt for templates with expiresAfter", () => {
    const result = renderTemplate("SALE_OVERDUE", {
      invoiceNo: "INV-002",
      partyName: "Test",
      amount: "100",
      saleId: "s1",
    });
    expect(result).not.toBeNull();
    expect(result!.expiresAt).toBeInstanceOf(Date);
    const diff = result!.expiresAt!.getTime() - Date.now();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns null for unknown template", () => {
    expect(renderTemplate("UNKNOWN", {})).toBeNull();
  });

  it("renders inventory notification", () => {
    const result = renderTemplate("LOW_STOCK_ALERT", {
      itemName: "Widget",
      currentStock: 3,
    });
    expect(result!.message).toBe("Low stock alert: Widget (3 remaining)");
    expect(result!.link).toBe("/inventory");
  });

  it("renders expense notification", () => {
    const result = renderTemplate("EXPENSE_CREATED", {
      category: "Travel",
      amount: "Rs. 2,000",
    });
    expect(result!.message).toBe(
      "New expense recorded: Travel - Rs. 2,000"
    );
  });
});
