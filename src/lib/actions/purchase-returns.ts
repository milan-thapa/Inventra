"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, PaymentMethod } from "@prisma/client";
import { recalculatePartyBalance } from "./party";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getPurchaseReturns(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchaseReturns = await db.purchaseReturn.findMany({
      where: { profileId },
      include: {
        purchase: {
          select: { billNo: true },
        },
        party: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    return { data: purchaseReturns };
  } catch (error) {
    console.error("[getPurchaseReturns]", error);
    return { error: "Failed to fetch purchase returns" };
  }
}

export async function getPurchaseReturn(profileId: string, returnId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchaseReturn = await db.purchaseReturn.findFirst({
      where: { id: returnId, profileId },
      include: {
        purchase: {
          include: {
            items: true,
          },
        },
        party: true,
        items: true,
      },
    });

    if (!purchaseReturn) return { error: "Purchase return not found" };

    return { data: purchaseReturn };
  } catch (error) {
    console.error("[getPurchaseReturn]", error);
    return { error: "Failed to fetch purchase return" };
  }
}

export async function getNextReturnNo(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastReturn = await db.purchaseReturn.findFirst({
      where: { profileId },
      orderBy: { returnNo: "desc" },
    });

    const nextReturnNo = (lastReturn?.returnNo || 0) + 1;
    return { data: nextReturnNo };
  } catch (error) {
    console.error("[getNextReturnNo]", error);
    return { error: "Failed to get next return number" };
  }
}

export async function createPurchaseReturn(
  profileId: string,
  data: {
    purchaseId?: string;
    partyId?: string;
    items: { itemId?: string; name: string; quantity: number; rate: number; amount: number }[];
    totalAmount: number;
    refundAmount: number;
    reason: string;
    remarks?: string;
    date: Date;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastReturn = await db.purchaseReturn.findFirst({
      where: { profileId },
      orderBy: { returnNo: "desc" },
    });
    const returnNo = (lastReturn?.returnNo || 0) + 1;

    const result = await db.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          profileId,
          returnNo,
          purchaseId: data.purchaseId,
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          refundAmount: data.refundAmount,
          reason: data.reason,
          remarks: data.remarks,
          date: data.date,
          status: "PENDING",
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            })),
          },
        },
      });

      return purchaseReturn;
    });

    revalidatePath("/purchase");
    revalidatePath("/purchase/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { data: result };
  } catch (e) {
    console.error("[createPurchaseReturn]", e);
    return { error: "Failed to create purchase return" };
  }
}

export async function updatePurchaseReturn(
  profileId: string,
  returnId: string,
  data: {
    status?: string;
    remarks?: string;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      const existingReturn = await tx.purchaseReturn.findUnique({
        where: { id: returnId, profileId },
        include: { items: true },
      });

      if (!existingReturn) throw new Error("Purchase return not found");

      const updatedReturn = await tx.purchaseReturn.update({
        where: { id: returnId },
        data: {
          status: data.status,
          remarks: data.remarks,
        },
      });

      // If status is being changed to COMPLETED, restore inventory (decrement stock)
      if (data.status === "COMPLETED" && existingReturn.status !== "COMPLETED") {
        for (const item of existingReturn.items) {
          if (item.itemId) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      // If status is being changed from COMPLETED to something else, reverse the inventory restoration
      if (existingReturn.status === "COMPLETED" && data.status !== "COMPLETED") {
        for (const item of existingReturn.items) {
          if (item.itemId) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // If status is COMPLETED and there's a party, record a party transaction
      if (data.status === "COMPLETED" && existingReturn.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
          where: { profileId, type: PartyTxType.PAYMENT_IN },
          orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        await tx.partyTransaction.create({
          data: {
            partyId: existingReturn.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.PAYMENT_IN,
            amount: existingReturn.refundAmount,
            paymentMethod: "CASH" as PaymentMethod,
            remarks: `Purchase Return #${existingReturn.returnNo}`,
            date: existingReturn.date,
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, existingReturn.partyId);
      }

      // If status is being changed from COMPLETED to something else, remove the party transaction
      if (existingReturn.status === "COMPLETED" && data.status !== "COMPLETED" && existingReturn.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Purchase Return #${existingReturn.returnNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, existingReturn.partyId);
      }

      return updatedReturn;
    });

    revalidatePath("/purchase");
    revalidatePath("/purchase/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { data: result };
  } catch (e) {
    console.error("[updatePurchaseReturn]", e);
    return { error: "Failed to update purchase return" };
  }
}

export async function deletePurchaseReturn(profileId: string, returnId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchaseReturn = await db.purchaseReturn.findFirst({
      where: { id: returnId, profileId },
      include: { items: true },
    });

    if (!purchaseReturn) return { error: "Purchase return not found" };

    await db.$transaction(async (tx) => {
      // If the return was COMPLETED, reverse the inventory restoration
      if (purchaseReturn.status === "COMPLETED") {
        for (const item of purchaseReturn.items) {
          if (item.itemId) {
            await tx.item.update({
              where: { id: item.itemId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // If the return was COMPLETED and had a party transaction, remove it
      if (purchaseReturn.status === "COMPLETED" && purchaseReturn.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Purchase Return #${purchaseReturn.returnNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, purchaseReturn.partyId);
      }

      // Delete the purchase return (items will be deleted automatically due to Cascade)
      await tx.purchaseReturn.delete({
        where: { id: returnId },
      });
    });

    revalidatePath("/purchase");
    revalidatePath("/purchase/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { success: true };
  } catch (e) {
    console.error("[deletePurchaseReturn]", e);
    return { error: "Failed to delete purchase return" };
  }
}
