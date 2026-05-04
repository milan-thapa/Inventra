// src/lib/actions/party.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { serialize } from "@/lib/utils";
import type { CreatePartyInput, AddPaymentInInput } from "@/lib/validations/party";

// ── Verify profile ownership ──────────────────────────────
async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  });
}

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
    console.error("[getParties]", e);
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
  } catch {
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
    console.error("[createParty]", e);
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
  } catch {
    return { error: "Failed to update party" };
  }
}

// ── Delete party ──────────────────────────────────────────
export async function deleteParty(profileId: string, partyId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.party.delete({ where: { id: partyId } });
    revalidatePath("/parties");
    return { success: true };
  } catch {
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
    console.error("[addPaymentIn]", e);
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
    console.error("[addPaymentOut]", e);
    return { error: "Failed to add payment" };
  }
}

// ── Recalculate party balance ─────────────────────────────
async function recalculatePartyBalance(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
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
  } catch {
    return { error: "Failed to get summary" };
  }
}
