// src/lib/actions/expense.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { serialize } from "@/lib/utils";
import type { CreateExpenseInput } from "@/lib/validations/expense";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

// ── Get expenses ──────────────────────────────────────────
export async function getExpenses(
  profileId: string,
  options: {
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const { search, categoryId, paymentMethod, dateFrom, dateTo, page = 1, limit = 20 } = options;

  try {
    const where = {
      profileId,
      ...(categoryId && { categoryId }),
      ...(paymentMethod && { paymentMethod: paymentMethod as "CASH" | "BANK" }),
      ...(search && {
        OR: [
          { remarks: { contains: search, mode: "insensitive" as const } },
          { category: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...((dateFrom || dateTo) && {
        date: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { category: true, items: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    return { data: serialize(expenses), total, page, limit };
  } catch (e) {
    console.error("[getExpenses]", e);
    return { error: "Failed to fetch expenses" };
  }
}

// ── Create expense ────────────────────────────────────────
export async function createExpense(profileId: string, input: CreateExpenseInput) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastExpense = await db.expense.findFirst({
      where: { profileId },
      orderBy: { expenseNo: "desc" },
    });
    const expenseNo = (lastExpense?.expenseNo ?? 0) + 1;

    const expense = await db.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          profileId,
          expenseNo,
          categoryId: input.categoryId,
          totalAmount: input.totalAmount,
          paymentMethod: input.paymentMethod as "CASH" | "BANK",
          remarks: input.remarks || null,
          billImage: input.billImage || null,
          date: input.date,
          items: {
            create: input.items?.map((item) => ({
              name: item.name,
              amount: item.amount,
            })) ?? [],
          },
        },
        include: { category: true },
      });

      await tx.transaction.create({
        data: {
          profileId,
          type: "EXPENSE",
          referenceId: newExpense.id,
          amount: input.totalAmount,
          description: newExpense.category.name,
          date: input.date,
        },
      });

      return newExpense;
    });

    revalidatePath("/expense");
    revalidatePath("/dashboard");
    return { data: serialize(expense) };
  } catch (e) {
    console.error("[createExpense]", e);
    return { error: "Failed to create expense" };
  }
}

// ── Update expense ────────────────────────────────────────
export async function updateExpense(
  profileId: string,
  expenseId: string,
  input: Partial<CreateExpenseInput>
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const expense = await db.expense.update({
      where: { id: expenseId },
      data: {
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.totalAmount && { totalAmount: input.totalAmount }),
        ...(input.paymentMethod && { paymentMethod: input.paymentMethod as "CASH" | "BANK" }),
        ...(input.remarks !== undefined && { remarks: input.remarks || null }),
        ...(input.date && { date: input.date }),
      },
    });
    revalidatePath("/expense");
    return { data: expense };
  } catch {
    return { error: "Failed to update expense" };
  }
}

// ── Delete expense ────────────────────────────────────────
export async function deleteExpense(profileId: string, expenseId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.expense.delete({ where: { id: expenseId } });
    revalidatePath("/expense");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to delete expense" };
  }
}

// ── Get expense categories ────────────────────────────────
export async function getExpenseCategories(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const categories = await db.expenseCategory.findMany({
      where: { profileId },
      include: {
        _count: { select: { expenses: true } },
        expenses: { select: { totalAmount: true } },
      },
      orderBy: { name: "asc" },
    });
    return { data: categories };
  } catch {
    return { error: "Failed to fetch categories" };
  }
}

// ── Create expense category ───────────────────────────────
export async function createExpenseCategory(profileId: string, name: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const category = await db.expenseCategory.create({
      data: { profileId, name },
    });
    revalidatePath("/settings/feature-settings/transactions");
    return { data: category };
  } catch {
    return { error: "Category already exists or failed to create" };
  }
}

// ── Delete expense category ───────────────────────────────
export async function deleteExpenseCategory(profileId: string, categoryId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.expenseCategory.delete({ where: { id: categoryId } });
    revalidatePath("/settings/feature-settings/transactions");
    return { success: true };
  } catch {
    return { error: "Cannot delete category with existing expenses" };
  }
}

// ── Get income (same pattern) ─────────────────────────────
export async function getIncomes(
  profileId: string,
  options: {
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const { search, categoryId, paymentMethod, dateFrom, dateTo, page = 1, limit = 20 } = options;

  try {
    const where = {
      profileId,
      ...(categoryId && { categoryId }),
      ...(paymentMethod && { paymentMethod: paymentMethod as "CASH" | "BANK" }),
      ...(search && {
        OR: [
          { remarks: { contains: search, mode: "insensitive" as const } },
          { category: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...((dateFrom || dateTo) && {
        date: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [incomes, total] = await Promise.all([
      db.income.findMany({
        where,
        include: { category: true, items: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.income.count({ where }),
    ]);

    return { data: serialize(incomes), total, page, limit };
  } catch {
    return { error: "Failed to fetch incomes" };
  }
}

export async function createIncome(profileId: string, input: CreateExpenseInput) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastIncome = await db.income.findFirst({
      where: { profileId },
      orderBy: { incomeNo: "desc" },
    });
    const incomeNo = (lastIncome?.incomeNo ?? 0) + 1;

    const income = await db.$transaction(async (tx) => {
      const newIncome = await tx.income.create({
        data: {
          profileId,
          incomeNo,
          categoryId: input.categoryId,
          totalAmount: input.totalAmount,
          paymentMethod: input.paymentMethod as "CASH" | "BANK",
          remarks: input.remarks || null,
          billImage: input.billImage || null,
          date: input.date,
          items: {
            create: input.items?.map((item) => ({
              name: item.name,
              amount: item.amount,
            })) ?? [],
          },
        },
        include: { category: true },
      });

      await tx.transaction.create({
        data: {
          profileId,
          type: "INCOME",
          referenceId: newIncome.id,
          amount: input.totalAmount,
          description: newIncome.category.name,
          date: input.date,
        },
      });

      return newIncome;
    });

    revalidatePath("/income");
    revalidatePath("/dashboard");
    return { data: serialize(income) };
  } catch (e) {
    console.error("[createIncome]", e);
    return { error: "Failed to create income" };
  }
}

export async function deleteIncome(profileId: string, incomeId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.income.delete({ where: { id: incomeId } });
    revalidatePath("/income");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to delete income" };
  }
}

export async function getIncomeCategories(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const categories = await db.incomeCategory.findMany({
      where: { profileId },
      orderBy: { name: "asc" },
    });
    return { data: categories };
  } catch {
    return { error: "Failed to fetch categories" };
  }
}

export async function createIncomeCategory(profileId: string, name: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const category = await db.incomeCategory.create({
      data: { profileId, name },
    });
    revalidatePath("/settings/feature-settings/transactions");
    return { data: category };
  } catch {
    return { error: "Category already exists or failed to create" };
  }
}
