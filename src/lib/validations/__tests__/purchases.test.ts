import { describe, it, expect } from "vitest";
import {
  purchaseItemSchema,
  createPurchaseSchema,
} from "@/lib/validations/purchases";

describe("purchaseItemSchema", () => {
  it("accepts valid item", () => {
    const result = purchaseItemSchema.safeParse({
      name: "Raw Material",
      quantity: 10,
      rate: 50,
      amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      purchaseItemSchema.safeParse({
        name: "",
        quantity: 1,
        rate: 10,
        amount: 10,
      }).success
    ).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const result = purchaseItemSchema.safeParse({
      name: "A",
      quantity: 1.5,
      rate: 10,
      amount: 15,
    });
    expect(result.success).toBe(false);
  });
});

describe("createPurchaseSchema", () => {
  const validPurchase = {
    items: [{ name: "Material", quantity: 5, rate: 200, amount: 1000 }],
    totalAmount: 1000,
    discount: 50,
    tax: 130,
    grandTotal: 1080,
    paymentMethod: "BANK" as const,
    status: "UNPAID" as const,
    date: new Date(),
  };

  it("accepts valid purchase", () => {
    const result = createPurchaseSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createPurchaseSchema.safeParse({
      ...validPurchase,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional partyId and billNo", () => {
    const result = createPurchaseSchema.safeParse({
      ...validPurchase,
      partyId: "party-1",
      billNo: 42,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all status values", () => {
    for (const status of ["PAID", "UNPAID", "PARTIAL"] as const) {
      expect(
        createPurchaseSchema.safeParse({ ...validPurchase, status }).success
      ).toBe(true);
    }
  });

  it("rejects negative grandTotal", () => {
    const result = createPurchaseSchema.safeParse({
      ...validPurchase,
      grandTotal: -100,
    });
    expect(result.success).toBe(false);
  });
});
