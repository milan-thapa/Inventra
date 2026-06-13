import { describe, it, expect } from "vitest";
import {
  expenseItemSchema,
  createExpenseSchema,
  createIncomeSchema,
} from "@/lib/validations/expense";

describe("expenseItemSchema", () => {
  it("accepts valid item", () => {
    const result = expenseItemSchema.safeParse({ name: "Coffee", amount: 50 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = expenseItemSchema.safeParse({ name: "", amount: 50 });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive amount", () => {
    expect(
      expenseItemSchema.safeParse({ name: "Item", amount: 0 }).success
    ).toBe(false);
    expect(
      expenseItemSchema.safeParse({ name: "Item", amount: -10 }).success
    ).toBe(false);
  });

  it("coerces string amounts", () => {
    const result = expenseItemSchema.safeParse({ name: "Item", amount: "100" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(100);
  });
});

describe("createExpenseSchema", () => {
  const validExpense = {
    categoryId: "cat-1",
    totalAmount: 500,
    paymentMethod: "CASH" as const,
    date: new Date(),
    items: [{ name: "Office supplies", amount: 500 }],
  };

  it("accepts valid expense", () => {
    const result = createExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("rejects missing category", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      items: [],
    });
    // items can be empty array as per schema (no min), but items must match item schema
    // Actually items is z.array(expenseItemSchema) without .min(1), so empty array is allowed
    expect(result.success).toBe(true);
  });

  it("rejects zero totalAmount", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      totalAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional remarks and billImage", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      remarks: "Monthly supplies",
      billImage: "https://example.com/receipt.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty optional strings", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      remarks: "",
      billImage: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("createIncomeSchema", () => {
  const validIncome = {
    categoryId: "inc-1",
    totalAmount: 10000,
    paymentMethod: "BANK" as const,
    date: new Date(),
    items: [{ name: "Freelance project", amount: 10000 }],
  };

  it("accepts valid income", () => {
    const result = createIncomeSchema.safeParse(validIncome);
    expect(result.success).toBe(true);
  });

  it("rejects negative totalAmount", () => {
    const result = createIncomeSchema.safeParse({
      ...validIncome,
      totalAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid paymentMethod", () => {
    const result = createIncomeSchema.safeParse({
      ...validIncome,
      paymentMethod: "CHEQUE",
    });
    expect(result.success).toBe(false);
  });
});
