// src/lib/actions/party.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { serialize } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { CreatePartyInput, AddPaymentInInput } from "@/lib/validations/party";
import { verifyProfile } from "@/lib/actions/shared";

// ── Get all parties ───────────────────────────────────────
export async function getParties(
  profileId: string,
  filter: "ALL" | "TO_RECEIVE" | "TO_GIVE" | "SETTLED" = "ALL",
  search = ""
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const parties = await db.party.findMany({
      where: {
        profileId,
        ...(filter !== "ALL" && { balanceType: filter as "TO_RECEIVE" | "TO_GIVE" | "SETTLED" }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        partyTransactions: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: { select: { partyTransactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Convert Decimal to number for client serialization
    const serializedParties = parties.map(party => ({
      ...party,
      openingBalance: Number(party.openingBalance),
      partyTransactions: party.partyTransactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount)
      }))
    }));

    return { data: serializedParties };
  } catch (e) {
    logger.error("Failed to fetch parties", e, { profileId });
    return { error: "Failed to fetch parties" };
  }
}

// ── Get single party with transactions ───────────────────
export async function getParty(profileId: string, partyId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const party = await db.party.findFirst({
      where: { id: partyId, profileId },
      include: {
        partyTransactions: {
          orderBy: { date: "desc" },
        },
      },
    });
    if (!party) return { error: "Party not found" };
    return { data: serialize(party) };
  } catch (e) {
    logger.error("Failed to fetch party", e, { profileId, partyId });
    return { error: "Failed to fetch party" };
  }
}

// ── Create party ──────────────────────────────────────────
export async function createParty(profileId: string, input: CreatePartyInput) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const party = await db.$transaction(async (tx) => {
      const newParty = await tx.party.create({
        data: {
          profileId,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          panNumber: input.panNumber || null,
          photo: input.photo || null,
          openingBalance: input.openingBalance,
          openingDate: input.openingDate,
          balanceType: input.balanceType as "TO_RECEIVE" | "TO_GIVE",
        },
      });

      // Create opening balance transaction
      if (input.openingBalance > 0) {
        await tx.partyTransaction.create({
          data: {
            partyId: newParty.id,
            profileId,
            receiptNumber: 1,
            type: "OPENING_BALANCE",
            amount: input.openingBalance,
            paymentMethod: "CASH",
            date: input.openingDate,
          },
        });
      }

      return newParty;
    });

    revalidatePath("/parties");
    return { data: serialize(party) };
  } catch (e) {
    logger.error("Failed to create party", e, { profileId, input });
    return { error: "Failed to create party" };
  }
}

// ── Update party ──────────────────────────────────────────
export async function updateParty(
  profileId: string,
  partyId: string,
  input: Partial<CreatePartyInput>
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const party = await db.party.update({
      where: { id: partyId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.panNumber !== undefined && { panNumber: input.panNumber || null }),
        ...(input.photo !== undefined && { photo: input.photo || null }),
      },
    });
    revalidatePath("/parties");
    return { data: serialize(party) };
  } catch (e) {
    logger.error("Failed to update party", e, { profileId, partyId });
    return { error: "Failed to update party" };
  }
}

// ── Delete party (soft delete) ─────────────────────────────
export async function deleteParty(profileId: string, partyId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.party.update({
      where: { id: partyId },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/parties");
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete party", e, { profileId, partyId });
    return { error: "Failed to delete party" };
  }
}

// ── Add Payment In ────────────────────────────────────────
export async function addPaymentIn(profileId: string, input: AddPaymentInInput) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      const party = await tx.party.findFirst({
        where: { id: input.partyId, profileId },
      });
      if (!party) throw new Error("Party not found");

      // Get next receipt number
      const lastTx = await tx.partyTransaction.findFirst({
        where: { profileId, type: "PAYMENT_IN" },
        orderBy: { receiptNumber: "desc" },
      });
      const receiptNumber = (lastTx?.receiptNumber ?? 0) + 1;

      const txRecord = await tx.partyTransaction.create({
        data: {
          partyId: input.partyId,
          profileId,
          receiptNumber,
          type: "PAYMENT_IN",
          amount: input.amount,
          paymentMethod: input.paymentMethod as "CASH" | "BANK",
          remarks: input.remarks || null,
          billImage: input.billImage || null,
          date: input.date,
        },
      });

      // Recalculate party balance
      await recalculatePartyBalance(tx, input.partyId);

      // Log to unified transactions
      await tx.transaction.create({
        data: {
          profileId,
          type: "PAYMENT_IN",
          referenceId: txRecord.id,
          amount: input.amount,
          description: `Payment In from ${party.name}`,
          date: input.date,
        },
      });

      return txRecord;
    });

    revalidatePath("/parties");
    revalidatePath("/dashboard");
    return { data: serialize(result) };
  } catch (e) {
    logger.error("Failed to add payment in", e, { profileId, input });
    return { error: "Failed to add payment" };
  }
}

// ── Add Payment Out ───────────────────────────────────────
export async function addPaymentOut(profileId: string, input: AddPaymentInInput) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      const party = await tx.party.findFirst({
        where: { id: input.partyId, profileId },
      });
      if (!party) throw new Error("Party not found");

      const lastTx = await tx.partyTransaction.findFirst({
        where: { profileId, type: "PAYMENT_OUT" },
        orderBy: { receiptNumber: "desc" },
      });
      const receiptNumber = (lastTx?.receiptNumber ?? 0) + 1;

      const txRecord = await tx.partyTransaction.create({
        data: {
          partyId: input.partyId,
          profileId,
          receiptNumber,
          type: "PAYMENT_OUT",
          amount: input.amount,
          paymentMethod: input.paymentMethod as "CASH" | "BANK",
          remarks: input.remarks || null,
          billImage: input.billImage || null,
          date: input.date,
        },
      });

      await recalculatePartyBalance(tx, input.partyId);

      await tx.transaction.create({
        data: {
          profileId,
          type: "PAYMENT_OUT",
          referenceId: txRecord.id,
          amount: input.amount,
          description: `Payment Out to ${party.name}`,
          date: input.date,
        },
      });

      return txRecord;
    });

    revalidatePath("/parties");
    revalidatePath("/dashboard");
    return { data: serialize(result) };
  } catch (e) {
    logger.error("Failed to add payment out", e, { profileId, input });
    return { error: "Failed to add payment" };
  }
}

// ── Recalculate party balance ─────────────────────────────
export async function recalculatePartyBalance(
  tx: any,
  partyId: string
) {
  const party = await tx.party.findUnique({ where: { id: partyId } });
  if (!party) return;

  const txs = await tx.partyTransaction.findMany({
    where: { partyId },
    orderBy: { date: "asc" },
  });

  let balance = 0;
  for (const t of txs) {
    const amount = Number(t.amount);
    if (t.type === "OPENING_BALANCE") {
      balance = party.balanceType === "TO_RECEIVE" ? amount : -amount;
    } else if (t.type === "PAYMENT_IN") {
      // Customer pays me -> Receivable goes down (-)
      balance -= amount;
    } else if (t.type === "PAYMENT_OUT") {
      // I pay supplier -> Payable goes down (+)
      balance += amount;
    } else if (t.type === "SALE") {
      // I sell to customer -> Receivable goes up (+)
      balance += amount;
    } else if (t.type === "PURCHASE") {
      // I buy from supplier -> Payable goes up (-)
      balance -= amount;
    }
  }

  const newBalanceType =
    balance > 0 ? "TO_RECEIVE" : balance < 0 ? "TO_GIVE" : "SETTLED";

  await tx.party.update({
    where: { id: partyId },
    data: {
      openingBalance: Math.abs(balance),
      balanceType: newBalanceType,
    },
  });
}

// ── Get party summary stats ───────────────────────────────
export async function getPartySummary(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const [toReceive, toGive] = await Promise.all([
      db.party.aggregate({
        where: { profileId, balanceType: "TO_RECEIVE" },
        _sum: { openingBalance: true },
        _count: true,
      }),
      db.party.aggregate({
        where: { profileId, balanceType: "TO_GIVE" },
        _sum: { openingBalance: true },
        _count: true,
      }),
    ]);

    return {
      data: {
        totalReceivable: Number(toReceive._sum.openingBalance ?? 0),
        totalPayable: Number(toGive._sum.openingBalance ?? 0),
        receivableCount: toReceive._count,
        payableCount: toGive._count,
      },
    };
  } catch (e) {
    logger.error("Failed to get party summary", e, { profileId });
    return { error: "Failed to get summary" };
  }
}

// ── Get payment transactions for Sales Payment In tab ───────────────────────────────
export async function getPaymentTransactions(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const transactions = await db.partyTransaction.findMany({
      where: {
        profileId,
        type: "PAYMENT_IN",
      },
      include: {
        party: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return { data: transactions };
  } catch (e) {
    logger.error("Failed to fetch payment transactions", e, { profileId });
    return { error: "Failed to fetch payment transactions" };
  }
}

// ── Delete Payment Transaction ───────────────────────────────────────
export async function deletePaymentTransaction(profileId: string, transactionId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.partyTransaction.findFirst({
        where: { id: transactionId, profileId },
      });
      if (!transaction) throw new Error("Transaction not found");

      // Delete the transaction
      await tx.partyTransaction.delete({
        where: { id: transactionId },
      });

      // Recalculate party balance
      const party = await tx.party.findFirst({
        where: { id: transaction.partyId, profileId },
      });
      if (party) {
        await recalculatePartyBalance(tx, party.id);
      }

      // Delete from unified transactions
      await tx.transaction.deleteMany({
        where: { referenceId: transactionId },
      });

      return transaction;
    });

    revalidatePath("/sales");
    revalidatePath("/parties");
    revalidatePath("/dashboard");
    return { data: serialize(result) };
  } catch (e) {
    logger.error("Failed to delete payment transaction", e, { profileId, transactionId });
    return { error: "Failed to delete payment" };
  }
}
