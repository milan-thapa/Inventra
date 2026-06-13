// src/lib/actions/reports.ts
"use server";

import { db } from "@/lib/db";
import { verifyProfile, buildCategoryReport } from "@/lib/actions/shared";

// ── All Party Report ──────────────────────────────────────
export async function getAllPartyReport(
  profileId: string,
  filter: { search?: string; dueType?: string } = {}
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const parties = await db.party.findMany({
      where: {
        profileId,
        ...(filter.search && {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { phone: { contains: filter.search } },
          ],
        }),
        ...(filter.dueType && filter.dueType !== "ALL" && {
          balanceType: filter.dueType as "TO_RECEIVE" | "TO_GIVE",
        }),
      },
      orderBy: { name: "asc" },
    });

    const totalReceivable = parties
      .filter((p) => p.balanceType === "TO_RECEIVE")
      .reduce((sum, p) => sum + Number(p.openingBalance), 0);

    const totalPayable = parties
      .filter((p) => p.balanceType === "TO_GIVE")
      .reduce((sum, p) => sum + Number(p.openingBalance), 0);

    return { data: parties, totalReceivable, totalPayable };
  } catch {
    return { error: "Failed to generate report" };
  }
}

// ── Cash In Hand Statement ────────────────────────────────
export async function getCashInHandStatement(
  profileId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const from = dateFrom ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = dateTo ?? new Date();

  try {
    const transactions = await db.transaction.findMany({
      where: {
        profileId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
    });

    let balance = 0;
    const rows = transactions.map((tx) => {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME" || tx.type === "PAYMENT_IN") {
        balance += amount;
        return { ...tx, moneyIn: amount, moneyOut: 0, balance };
      } else {
        balance -= amount;
        return { ...tx, moneyIn: 0, moneyOut: amount, balance };
      }
    });

    return {
      data: rows,
      closingBalance: balance,
      from,
      to,
      profileName: profile.name,
    };
  } catch {
    return { error: "Failed to generate statement" };
  }
}

// ── Expense Category Report ───────────────────────────────
export async function getExpenseCategoryReport(
  profileId: string,
  dateFrom?: Date,
  dateTo?: Date,
) {
  return buildCategoryReport(profileId, "expenseCategory", "expenses", dateFrom, dateTo);
}

// ── Income Category Report ────────────────────────────────
export async function getIncomeCategoryReport(
  profileId: string,
  dateFrom?: Date,
  dateTo?: Date,
) {
  return buildCategoryReport(profileId, "incomeCategory", "incomes", dateFrom, dateTo);
}
