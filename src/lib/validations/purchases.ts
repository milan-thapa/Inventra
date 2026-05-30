// src/lib/validations/purchases.ts
import { z } from "zod";

export const purchaseItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const createPurchaseSchema = z.object({
  partyId: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  tax: z.coerce.number().min(0, "Tax cannot be negative"),
  grandTotal: z.coerce.number().positive("Grand total must be positive"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  status: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  remarks: z.string().optional(),
  billNo: z.coerce.number().int().positive().optional(),
  date: z.coerce.date(),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
