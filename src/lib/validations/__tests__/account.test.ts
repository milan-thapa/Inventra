import { describe, it, expect } from "vitest";
import {
  createAccountSchema,
  createReminderSchema,
  updateReminderSchema,
  createProfileSchema,
  updateSettingsSchema,
} from "@/lib/validations/account";

// ── Account ───────────────────────────────────────────────
describe("createAccountSchema", () => {
  it("accepts valid account", () => {
    const result = createAccountSchema.safeParse({
      bankName: "Nepal Bank",
      holderName: "John Doe",
      accountNumber: "1234567890",
      currentBalance: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal data with defaults", () => {
    const result = createAccountSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("Bank Account");
      expect(result.data.currentBalance).toBe(0);
    }
  });

  it("accepts empty optional strings", () => {
    const result = createAccountSchema.safeParse({
      bankName: "",
      holderName: "",
      accountNumber: "",
    });
    expect(result.success).toBe(true);
  });
});

// ── Reminder ──────────────────────────────────────────────
describe("createReminderSchema", () => {
  it("accepts valid task reminder", () => {
    const result = createReminderSchema.safeParse({
      title: "Follow up with client",
      type: "TASK",
      dueDate: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts payment reminder", () => {
    const result = createReminderSchema.safeParse({
      title: "Pay vendor",
      type: "PAYMENT",
      dueDate: "2024-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(
      createReminderSchema.safeParse({
        title: "",
        dueDate: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    expect(
      createReminderSchema.safeParse({
        title: "a".repeat(201),
        dueDate: new Date(),
      }).success
    ).toBe(false);
  });

  it("defaults type to TASK", () => {
    const result = createReminderSchema.safeParse({
      title: "Test",
      dueDate: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("TASK");
  });
});

describe("updateReminderSchema", () => {
  it("accepts partial updates", () => {
    expect(
      updateReminderSchema.safeParse({ title: "Updated" }).success
    ).toBe(true);
  });

  it("accepts isCompleted flag", () => {
    const result = updateReminderSchema.safeParse({ isCompleted: true });
    expect(result.success).toBe(true);
  });
});

// ── Profile ───────────────────────────────────────────────
describe("createProfileSchema", () => {
  it("accepts valid business profile", () => {
    const result = createProfileSchema.safeParse({
      type: "BUSINESS",
      name: "My Store",
    });
    expect(result.success).toBe(true);
  });

  it("accepts personal profile", () => {
    const result = createProfileSchema.safeParse({
      type: "PERSONAL",
      name: "Personal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      createProfileSchema.safeParse({ type: "BUSINESS", name: "" }).success
    ).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(
      createProfileSchema.safeParse({
        type: "BUSINESS",
        name: "x".repeat(101),
      }).success
    ).toBe(false);
  });

  it("defaults type to BUSINESS", () => {
    const result = createProfileSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("BUSINESS");
  });

  it("accepts optional fields", () => {
    const result = createProfileSchema.safeParse({
      name: "Store",
      category: "electronics",
      logo: "https://example.com/logo.png",
      address: "Kathmandu",
    });
    expect(result.success).toBe(true);
  });
});

// ── Settings ──────────────────────────────────────────────
describe("updateSettingsSchema", () => {
  it("accepts all valid settings", () => {
    const result = updateSettingsSchema.safeParse({
      currency: "Rs.",
      currencyPos: "start",
      language: "en",
      calendarType: "AD",
      theme: "dark",
      privacyMode: true,
      appLock: false,
      numberFormat: "indian",
      barcodeEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(true);
  });

  it("accepts Nepali language", () => {
    expect(
      updateSettingsSchema.safeParse({ language: "ne" }).success
    ).toBe(true);
  });

  it("rejects invalid theme", () => {
    expect(
      updateSettingsSchema.safeParse({ theme: "neon" }).success
    ).toBe(false);
  });

  it("rejects invalid language", () => {
    expect(
      updateSettingsSchema.safeParse({ language: "fr" }).success
    ).toBe(false);
  });

  it("rejects invalid calendarType", () => {
    expect(
      updateSettingsSchema.safeParse({ calendarType: "LUNAR" }).success
    ).toBe(false);
  });

  it("accepts all valid themes", () => {
    for (const theme of ["light", "dark", "classic", "system"]) {
      expect(
        updateSettingsSchema.safeParse({ theme }).success
      ).toBe(true);
    }
  });

  it("accepts international number format", () => {
    expect(
      updateSettingsSchema.safeParse({ numberFormat: "international" }).success
    ).toBe(true);
  });
});
