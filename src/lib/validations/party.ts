// src/lib/validations/party.ts
import { z } from "zod";

export const createPartySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  panNumber: z.string().optional().or(z.literal("")),
  photo: z.string().url().optional().or(z.literal("")),
  openingBalance: z.coerce.number().min(0),
  openingDate: z.coerce.date(),
  balanceType: z.enum(["TO_RECEIVE", "TO_GIVE"]),
});

export const updatePartySchema = createPartySchema.partial();

export const addPaymentInSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  receiptNumber: z.coerce.number().int().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  remarks: z.string().optional().or(z.literal("")),
  billImage: z.string().url().optional().or(z.literal("")),
  date: z.coerce.date(),
});

export const addPaymentOutSchema = addPaymentInSchema;

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
export type AddPaymentInInput = z.infer<typeof addPaymentInSchema>;
export type AddPaymentOutInput = z.infer<typeof addPaymentOutSchema>;
