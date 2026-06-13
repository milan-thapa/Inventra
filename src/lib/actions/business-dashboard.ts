"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { logger } from "@/lib/logger";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getBusinessDashboardStats(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile || profile.type !== "BUSINESS") return { error: "Unauthorized or Invalid Profile" };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const [salesAgg, purchasesAgg, expenseAgg, toReceiveAgg, toGiveAgg, inventoryAgg, bankAgg] =
      await Promise.all([
        db.sale.aggregate({
          where: { profileId, date: { gte: monthStart, lte: monthEnd } },
          _sum: { totalAmount: true },
        }),
        db.purchase.aggregate({
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
        db.item.findMany({
          where: { profileId },
          select: { stockQuantity: true, purchasePrice: true },
        }),
        db.bankAccount.aggregate({
          where: { profileId },
          _sum: { currentBalance: true },
        }),
      ]);

    // Calculate inventory valuation
    const inventoryValuation = inventoryAgg.reduce(
      (sum, item) => sum + item.stockQuantity * Number(item.purchasePrice),
      0
    );

    return {
      data: {
        sales: Number(salesAgg._sum.totalAmount ?? 0),
        purchases: Number(purchasesAgg._sum.totalAmount ?? 0),
        expense: Number(expenseAgg._sum.totalAmount ?? 0),
        toReceive: Number(toReceiveAgg._sum.openingBalance ?? 0),
        toGive: Number(toGiveAgg._sum.openingBalance ?? 0),
        inventoryValuation,
        totalBalance: Number(bankAgg._sum.currentBalance ?? 0),
        currentMonth: now.toLocaleString("default", { month: "long" }),
      },
    };
  } catch (e) {
    logger.error("Failed to fetch business dashboard stats", e, { profileId });
    return { error: "Failed to fetch stats" };
  }
}

export async function getBusinessCashflow(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const days = 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const [sales, purchases] = await Promise.all([
        db.sale.aggregate({
          where: { profileId, date: { gte: dayStart, lte: dayEnd } },
          _sum: { totalAmount: true },
        }),
        db.purchase.aggregate({
          where: { profileId, date: { gte: dayStart, lte: dayEnd } },
          _sum: { totalAmount: true },
        }),
      ]);

      result.push({
        date: date.toISOString(),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        moneyIn: Number(sales._sum.totalAmount ?? 0),
        moneyOut: Number(purchases._sum.totalAmount ?? 0),
      });
    }

    const totalIn = result.reduce((sum, d) => sum + d.moneyIn, 0);
    const totalOut = result.reduce((sum, d) => sum + d.moneyOut, 0);

    return { data: { chart: result, totalIn, totalOut } };
  } catch (e) {
    logger.error("Failed to fetch business cashflow", e, { profileId });
    return { error: "Failed to fetch cashflow" };
  }
}
