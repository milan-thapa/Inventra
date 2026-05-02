// src/lib/validations/expense.ts
import { z } from "zod";

export const expenseItemSchema = z.object({
  name: z.string().min(1, "Item name required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  totalAmount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  remarks: z.string().optional().or(z.literal("")),
  billImage: z.string().url().optional().or(z.literal("")),
  date: z.coerce.date(),
  items: z.array(expenseItemSchema),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// src/lib/validations/income.ts
export const createIncomeSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  totalAmount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  remarks: z.string().optional().or(z.literal("")),
  billImage: z.string().url().optional().or(z.literal("")),
  date: z.coerce.date(),
  items: z.array(expenseItemSchema),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
