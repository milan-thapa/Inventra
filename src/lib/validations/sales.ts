// src/lib/validations/sales.ts
import { z } from "zod";

export const saleItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const createSaleSchema = z.object({
  partyId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  tax: z.coerce.number().min(0, "Tax cannot be negative"),
  grandTotal: z.coerce.number().positive("Grand total must be positive"),
  receivedAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["CASH", "BANK"]),
  status: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  remarks: z.string().optional(),
  invoiceNo: z.coerce.number().int().positive().optional(),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  remarks: z.string().optional(),
  date: z.coerce.date(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
