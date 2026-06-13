import { describe, it, expect } from "vitest";
import {
  createItemSchema,
  updateItemSchema,
  adjustStockSchema,
  createItemCategorySchema,
} from "@/lib/validations/inventory";

describe("createItemSchema", () => {
  const validItem = {
    name: "Widget A",
    purchasePrice: 100,
    sellingPrice: 150,
    stockQuantity: 50,
  };

  it("accepts valid item with required fields only", () => {
    const result = createItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("accepts item with all fields", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      sku: "WDG-001",
      barcode: "1234567890",
      unit: "pcs",
      type: "PRODUCT",
      description: "A standard widget",
      categoryId: "cat-1",
      brand: "WidgetCo",
      manufacturer: "MfgCorp",
      reorderPoint: 5,
      maxStock: 200,
      weight: 0.5,
      dimensions: "10x5x3",
      shelfLocation: "A-1",
      images: ["https://example.com/img.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createItemSchema.safeParse({ ...validItem, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative purchase price", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      purchasePrice: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative selling price", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      sellingPrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative stock quantity", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      stockQuantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero prices and stock", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      purchasePrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
    });
    expect(result.success).toBe(true);
  });

  it("defaults type to PRODUCT", () => {
    const result = createItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("PRODUCT");
  });

  it("accepts SERVICE type", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      type: "SERVICE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      type: "MATERIAL",
    });
    expect(result.success).toBe(false);
  });

  it("defaults reorderPoint to 10", () => {
    const result = createItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reorderPoint).toBe(10);
  });
});

describe("updateItemSchema", () => {
  it("accepts partial updates", () => {
    const result = updateItemSchema.safeParse({ name: "Updated Widget" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(true);
  });
});

describe("adjustStockSchema", () => {
  it("accepts valid stock adjustment", () => {
    const result = adjustStockSchema.safeParse({
      quantity: 10,
      price: 50,
      adjustedDate: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative quantity (stock reduction)", () => {
    const result = adjustStockSchema.safeParse({
      quantity: -5,
      price: 50,
      adjustedDate: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = adjustStockSchema.safeParse({
      quantity: 0,
      price: 50,
      adjustedDate: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = adjustStockSchema.safeParse({
      quantity: 5,
      price: -10,
      adjustedDate: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe("createItemCategorySchema", () => {
  it("accepts valid category", () => {
    const result = createItemCategorySchema.safeParse({ name: "Electronics" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createItemCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(
      createItemCategorySchema.safeParse({ name: "a".repeat(101) }).success
    ).toBe(false);
  });
});
