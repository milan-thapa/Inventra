// src/lib/actions/shared.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Verifies the current user owns the given profile.
 * Returns the profile record or null if unauthorized.
 */
export async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  });
}

/**
 * Returns the next auto-increment number for any entity.
 *
 * Usage:
 *   const invoiceNo = await getNextSequenceNumber("sale", "profileId", profileId, "invoiceNo");
 *   const expenseNo = await getNextSequenceNumber("expense", "profileId", profileId, "expenseNo");
 */
export async function getNextSequenceNumber<
  M extends keyof typeof db,
>(
  model: M,
  filterField: string,
  filterValue: string,
  sequenceField: string,
): Promise<number> {
  try {
    const delegate = db[model] as any;
    const last = await delegate.findFirst({
      where: { [filterField]: filterValue },
      orderBy: { [sequenceField]: "desc" },
      select: { [sequenceField]: true },
    });
    return ((last?.[sequenceField] as number) ?? 0) + 1;
  } catch (e) {
    logger.error(`Failed to get next ${String(model)} sequence number`, e, {
      filterField,
      filterValue,
      sequenceField,
    });
    return 1;
  }
}

/**
 * Builds a category-aggregation report for either expense or income categories.
 * Eliminates the duplication between getExpenseCategoryReport and getIncomeCategoryReport.
 */
export async function buildCategoryReport(
  profileId: string,
  model: "expenseCategory" | "incomeCategory",
  relation: "expenses" | "incomes",
  dateFrom?: Date,
  dateTo?: Date,
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const from =
    dateFrom ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = dateTo ?? new Date();

  try {
    const delegate = db[model] as any;
    const categories = await delegate.findMany({
      where: { profileId },
      include: {
        [relation]: {
          where: { date: { gte: from, lte: to } },
          select: { totalAmount: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const report = categories.map(
      (cat: { id: string; name: string; [key: string]: unknown }) => {
        const items = cat[relation] as { totalAmount: unknown }[];
        return {
          id: cat.id,
          name: cat.name,
          totalTransactions: items.length,
          totalAmount: items.reduce(
            (sum: number, e: { totalAmount: unknown }) =>
              sum + Number(e.totalAmount),
            0,
          ),
        };
      },
    );

    const grandTotal = report.reduce(
      (sum: number, r: { totalAmount: number }) => sum + r.totalAmount,
      0,
    );

    return { data: report, grandTotal, from, to };
  } catch {
    return { error: "Failed to generate report" };
  }
}
