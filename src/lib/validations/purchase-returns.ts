// src/lib/validations/purchase-returns.ts
import { z } from "zod";

export const purchaseReturnItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const createPurchaseReturnSchema = z.object({
  purchaseId: z.string().optional(),
  partyId: z.string().optional(),
  items: z.array(purchaseReturnItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  refundAmount: z.coerce.number().positive("Refund amount must be positive"),
  reason: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).default("PENDING"),
  remarks: z.string().optional(),
  returnNo: z.coerce.number().int().positive().optional(),
  date: z.coerce.date(),
});

export const updatePurchaseReturnSchema = createPurchaseReturnSchema.partial();

export type CreatePurchaseReturnInput = z.infer<typeof createPurchaseReturnSchema>;
export type UpdatePurchaseReturnInput = z.infer<typeof updatePurchaseReturnSchema>;
