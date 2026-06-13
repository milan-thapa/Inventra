import { describe, it, expect } from "vitest";
import {
  createPartySchema,
  updatePartySchema,
  addPaymentInSchema,
} from "@/lib/validations/party";

describe("createPartySchema", () => {
  const validParty = {
    name: "Test Party",
    openingBalance: 0,
    openingDate: new Date(),
    balanceType: "TO_RECEIVE" as const,
  };

  it("accepts valid party data", () => {
    const result = createPartySchema.safeParse(validParty);
    expect(result.success).toBe(true);
  });

  it("accepts party with all optional fields", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      phone: "9841234567",
      email: "test@example.com",
      address: "Kathmandu",
      panNumber: "123456789",
      photo: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty optional strings", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      phone: "",
      email: "",
      address: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createPartySchema.safeParse({ ...validParty, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid balanceType", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      balanceType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative opening balance", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      openingBalance: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string dates", () => {
    const result = createPartySchema.safeParse({
      ...validParty,
      openingDate: "2024-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.openingDate).toBeInstanceOf(Date);
    }
  });
});

describe("updatePartySchema", () => {
  it("accepts partial updates", () => {
    const result = updatePartySchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updatePartySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("addPaymentInSchema", () => {
  const validPayment = {
    partyId: "party-1",
    receiptNumber: 1,
    amount: 100,
    paymentMethod: "CASH" as const,
    date: new Date(),
  };

  it("accepts valid payment", () => {
    const result = addPaymentInSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      amount: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty partyId", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      partyId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid paymentMethod", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      paymentMethod: "CREDIT_CARD",
    });
    expect(result.success).toBe(false);
  });

  it("accepts BANK payment method", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      paymentMethod: "BANK",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional remarks and billImage", () => {
    const result = addPaymentInSchema.safeParse({
      ...validPayment,
      remarks: "Paid via bank transfer",
      billImage: "https://example.com/bill.jpg",
    });
    expect(result.success).toBe(true);
  });
});
