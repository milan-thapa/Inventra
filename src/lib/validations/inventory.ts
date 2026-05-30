// src/lib/validations/inventory.ts
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
  stockQuantity: z.coerce.number().int().min(0, "Stock quantity cannot be negative"),
  unit: z.string().optional(),
  type: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  description: z.string().optional(),
  specifications: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  supplierId: z.string().optional(),
  reorderPoint: z.coerce.number().int().min(0).default(10),
  maxStock: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  dimensions: z.string().optional(),
  shelfLocation: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const adjustStockSchema = z.object({
  quantity: z.coerce.number().int().refine((val) => val !== 0, "Quantity must be non-zero"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  remarks: z.string().optional(),
  adjustedDate: z.coerce.date(),
});

export const createItemCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateItemCategoryInput = z.infer<typeof createItemCategorySchema>;
