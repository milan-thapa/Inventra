// src/lib/actions/dashboard.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { createNotification } from "./notification";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

// ── Dashboard stats ───────────────────────────────────────
export async function getDashboardStats(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const [incomeAgg, expenseAgg, toReceiveAgg, toGiveAgg, totalBalance] =
      await Promise.all([
        db.income.aggregate({
          where: { profileId, date: { gte: monthStart, lte: monthEnd } },
          _sum: { totalAmount: true },
        }),
        db.expense.aggregate({
          where: { profileId, date: { gte: monthStart, lte: monthEnd } },
          _sum: { totalAmount: true },
        }),
        db.party.aggregate({
          where: { profileId, balanceType: "TO_RECEIVE" },
          _sum: { openingBalance: true },
        }),
        db.party.aggregate({
          where: { profileId, balanceType: "TO_GIVE" },
          _sum: { openingBalance: true },
        }),
        db.bankAccount.aggregate({
          where: { profileId },
          _sum: { currentBalance: true },
        }),
      ]);

    return {
      data: {
        income: Number(incomeAgg._sum.totalAmount ?? 0),
        expense: Number(expenseAgg._sum.totalAmount ?? 0),
        toReceive: Number(toReceiveAgg._sum.openingBalance ?? 0),
        toGive: Number(toGiveAgg._sum.openingBalance ?? 0),
        totalBalance: Number(totalBalance._sum.currentBalance ?? 0),
        currentMonth: now.toLocaleString("default", { month: "long" }),
      },
    };
  } catch (e) {
    console.error("[getDashboardStats]", e);
    return { error: "Failed to fetch stats" };
  }
}

// ── Cashflow last 7 days ──────────────────────────────────
export async function getCashflow(profileId: string, period: "daily" | "weekly" | "monthly" = "daily") {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const days = period === "daily" ? 7 : period === "weekly" ? 28 : 90;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const [income, expense] = await Promise.all([
        db.income.aggregate({
          where: { profileId, date: { gte: dayStart, lte: dayEnd } },
          _sum: { totalAmount: true },
        }),
        db.expense.aggregate({
          where: { profileId, date: { gte: dayStart, lte: dayEnd } },
          _sum: { totalAmount: true },
        }),
      ]);

      result.push({
        date: date.toISOString(),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        moneyIn: Number(income._sum.totalAmount ?? 0),
        moneyOut: Number(expense._sum.totalAmount ?? 0),
      });
    }

    const totalIn = result.reduce((sum, d) => sum + d.moneyIn, 0);
    const totalOut = result.reduce((sum, d) => sum + d.moneyOut, 0);

    return { data: { chart: result, totalIn, totalOut } };
  } catch (e) {
    console.error("[getCashflow]", e);
    return { error: "Failed to fetch cashflow" };
  }
}

// ── Recent transactions ───────────────────────────────────
export async function getRecentTransactions(profileId: string, limit = 5) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const transactions = await db.transaction.findMany({
      where: { profileId },
      orderBy: { date: "desc" },
      take: limit,
    });
    return { data: transactions };
  } catch {
    return { error: "Failed to fetch transactions" };
  }
}

// src/lib/actions/account.ts
export async function getAccounts(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const accounts = await db.bankAccount.findMany({
      where: { profileId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    return { data: accounts, totalBalance };
  } catch {
    return { error: "Failed to fetch accounts" };
  }
}

export async function createAccount(
  profileId: string,
  input: {
    type: string;
    bankName?: string;
    holderName?: string;
    accountNumber?: string;
    currentBalance: number;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const account = await db.bankAccount.create({
      data: {
        profileId,
        type: input.type,
        bankName: input.bankName || null,
        holderName: input.holderName || null,
        accountNumber: input.accountNumber || null,
        currentBalance: input.currentBalance,
      },
    });
    return { data: account };
  } catch {
    return { error: "Failed to create account" };
  }
}

export async function deleteAccount(profileId: string, accountId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.bankAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });
    return { success: true };
  } catch {
    return { error: "Failed to delete account" };
  }
}

// src/lib/actions/reminder.ts
export async function getReminders(profileId: string, completed = false) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const reminders = await db.reminder.findMany({
      where: { profileId, isCompleted: completed },
      orderBy: { dueDate: "asc" },
    });
    return { data: reminders };
  } catch {
    return { error: "Failed to fetch reminders" };
  }
}

export async function createReminder(
  profileId: string,
  input: { title: string; type: string; dueDate: Date }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const reminder = await db.reminder.create({
      data: {
        profileId,
        title: input.title,
        type: input.type as "TASK" | "PAYMENT",
        dueDate: input.dueDate,
      },
    });

    // Create a notification
    await createNotification(
      profileId,
      profile.userId,
      input.type,
      `Reminder: ${input.title}`,
      "/business-tools/reminders"
    );

    return { data: reminder };
  } catch {
    return { error: "Failed to create reminder" };
  }
}

export async function toggleReminder(profileId: string, reminderId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const reminder = await db.reminder.findFirst({ where: { id: reminderId, profileId } });
    if (!reminder) return { error: "Not found" };

    const updated = await db.reminder.update({
      where: { id: reminderId },
      data: { isCompleted: !reminder.isCompleted },
    });
    return { data: updated };
  } catch {
    return { error: "Failed to update reminder" };
  }
}

export async function deleteReminder(profileId: string, reminderId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.reminder.delete({ where: { id: reminderId } });
    return { success: true };
  } catch {
    return { error: "Failed to delete reminder" };
  }
}
