import { describe, it, expect } from "vitest";
import {
  saleItemSchema,
  createSaleSchema,
  recordPaymentSchema,
} from "@/lib/validations/sales";

describe("saleItemSchema", () => {
  it("accepts valid item", () => {
    const result = saleItemSchema.safeParse({
      name: "Product A",
      quantity: 2,
      rate: 100,
      amount: 200,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      saleItemSchema.safeParse({ name: "", quantity: 1, rate: 10, amount: 10 })
        .success
    ).toBe(false);
  });

  it("rejects non-positive quantity", () => {
    expect(
      saleItemSchema.safeParse({
        name: "A",
        quantity: 0,
        rate: 10,
        amount: 10,
      }).success
    ).toBe(false);
  });

  it("rejects non-positive rate", () => {
    expect(
      saleItemSchema.safeParse({
        name: "A",
        quantity: 1,
        rate: -5,
        amount: 10,
      }).success
    ).toBe(false);
  });

  it("accepts optional itemId", () => {
    const result = saleItemSchema.safeParse({
      itemId: "item-1",
      name: "A",
      quantity: 1,
      rate: 10,
      amount: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("createSaleSchema", () => {
  const validSale = {
    items: [{ name: "Product", quantity: 1, rate: 100, amount: 100 }],
    totalAmount: 100,
    discount: 0,
    tax: 0,
    grandTotal: 100,
    paymentMethod: "CASH" as const,
    status: "PAID" as const,
    date: new Date(),
  };

  it("accepts valid sale", () => {
    const result = createSaleSchema.safeParse(validSale);
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createSaleSchema.safeParse({ ...validSale, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects negative discount", () => {
    const result = createSaleSchema.safeParse({
      ...validSale,
      discount: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative tax", () => {
    const result = createSaleSchema.safeParse({ ...validSale, tax: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts all status values", () => {
    for (const status of ["PAID", "UNPAID", "PARTIAL"] as const) {
      expect(
        createSaleSchema.safeParse({ ...validSale, status }).success
      ).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = createSaleSchema.safeParse({
      ...validSale,
      status: "CANCELLED",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional partyId and dueDate", () => {
    const result = createSaleSchema.safeParse({
      ...validSale,
      partyId: "party-1",
      dueDate: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

describe("recordPaymentSchema", () => {
  it("accepts valid payment", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 500,
      paymentMethod: "BANK",
      date: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 0,
      paymentMethod: "CASH",
      date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional remarks", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 100,
      paymentMethod: "CASH",
      date: new Date(),
      remarks: "Partial payment",
    });
    expect(result.success).toBe(true);
  });
});
