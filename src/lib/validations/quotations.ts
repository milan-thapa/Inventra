// src/lib/validations/quotations.ts
import { z } from "zod";

export const quotationItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const createQuotationSchema = z.object({
  partyId: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  tax: z.coerce.number().min(0, "Tax cannot be negative"),
  grandTotal: z.coerce.number().positive("Grand total must be positive"),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CONVERTED"]).default("DRAFT"),
  remarks: z.string().optional(),
  quotationNo: z.coerce.number().int().positive().optional(),
  date: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
