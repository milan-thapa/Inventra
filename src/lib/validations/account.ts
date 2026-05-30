// src/lib/validations/account.ts
import { z } from "zod";

export const createAccountSchema = z.object({
  type: z.string().default("Bank Account"),
  bankName: z.string().min(1, "Bank name required").optional().or(z.literal("")),
  holderName: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  currentBalance: z.coerce.number().default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// src/lib/validations/reminder.ts
export const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["TASK", "PAYMENT"]).default("TASK"),
  dueDate: z.coerce.date({ required_error: "Date is required" }),
});

export const updateReminderSchema = createReminderSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// src/lib/validations/profile.ts
export const createProfileSchema = z.object({
  type: z.enum(["BUSINESS", "PERSONAL"]).default("BUSINESS"),
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const updateProfileSchema = createProfileSchema.partial();

export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  currencyPos: z.enum(["start", "end"]).optional(),
  language: z.enum(["en", "ne"]).optional(),
  calendarType: z.enum(["AD", "BS"]).optional(),
  theme: z.enum(["light", "dark", "classic", "system"]).optional(),
  privacyMode: z.boolean().optional(),
  appLock: z.boolean().optional(),
  numberFormat: z.enum(["indian", "international"]).optional(),
  barcodeEnabled: z.boolean().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
