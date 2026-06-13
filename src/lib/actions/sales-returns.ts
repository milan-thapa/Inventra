"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, PaymentMethod } from "@prisma/client";
import { recalculatePartyBalance } from "./party";
import { logger } from "@/lib/logger";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getSalesReturns(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const salesReturns = await db.salesReturn.findMany({
      where: { profileId },
      include: {
        sale: {
          select: { id: true, invoiceNo: true },
        },
        party: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    return { data: salesReturns };
  } catch (error) {
    logger.error("Failed to fetch sales returns", error, { profileId });
    return { error: "Failed to fetch sales returns" };
  }
}

export async function getSalesReturn(profileId: string, returnId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const salesReturn = await db.salesReturn.findFirst({
      where: { id: returnId, profileId },
      include: {
        sale: {
          include: {
            items: true,
          },
        },
        party: true,
        items: true,
      },
    });

    if (!salesReturn) return { error: "Sales return not found" };

    return { data: salesReturn };
  } catch (error) {
    logger.error("Failed to fetch sales return", error, { profileId, returnId });
    return { error: "Failed to fetch sales return" };
  }
}

export async function getNextReturnNo(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastReturn = await db.salesReturn.findFirst({
      where: { profileId },
      orderBy: { returnNo: "desc" },
    });

    const nextNo = lastReturn ? lastReturn.returnNo + 1 : 1;
    return { data: nextNo };
  } catch (error) {
    logger.error("Failed to get next sales return number", error, { profileId });
    return { error: "Failed to get next return number" };
  }
}

export async function createSalesReturn(
  profileId: string,
  data: {
    saleId?: string;
    partyId?: string;
    items: Array<{ itemId?: string; name: string; quantity: number; rate: number; amount: number }>;
    totalAmount: number;
    refundAmount: number;
    reason?: string;
    remarks?: string;
    date: Date;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const nextReturnNo = await getNextReturnNo(profileId);
    if (nextReturnNo.error) {
      return nextReturnNo;
    }

    const result = await db.$transaction(async (tx) => {
      const newReturn = await tx.salesReturn.create({
        data: {
          profileId,
          returnNo: nextReturnNo.data as number,
          saleId: data.saleId,
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          refundAmount: data.refundAmount,
          reason: data.reason,
          remarks: data.remarks,
          status: "PENDING",
          date: data.date,
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

      return newReturn;
    });

    revalidatePath("/sales");
    revalidatePath("/sales/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { data: result };
  } catch (error) {
    logger.error("Failed to create sales return", error, { profileId });
    return { error: "Failed to create sales return" };
  }
}

export async function updateSalesReturn(
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
      const existingReturn = await tx.salesReturn.findUnique({
        where: { id: returnId, profileId },
        include: { items: true },
      });

      if (!existingReturn) throw new Error("Sales return not found");

      const updatedReturn = await tx.salesReturn.update({
        where: { id: returnId },
        data: {
          status: data.status,
          remarks: data.remarks,
        },
      });

      // If status is changing to COMPLETED, restore inventory (increment stock)
      if (data.status === "COMPLETED" && existingReturn.status !== "COMPLETED") {
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

      // If status is being changed from COMPLETED to something else, reverse the inventory restoration
      if (existingReturn.status === "COMPLETED" && data.status !== "COMPLETED") {
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

      // If status is COMPLETED and there's a party, record a party transaction
      if (data.status === "COMPLETED" && existingReturn.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
          where: { profileId, type: PartyTxType.PAYMENT_OUT },
          orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        await tx.partyTransaction.create({
          data: {
            partyId: existingReturn.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.PAYMENT_OUT,
            amount: existingReturn.refundAmount,
            paymentMethod: "CASH" as PaymentMethod,
            remarks: `Sales Return #${existingReturn.returnNo}`,
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
            remarks: { contains: `Sales Return #${existingReturn.returnNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, existingReturn.partyId);
      }

      return updatedReturn;
    });

    revalidatePath("/sales");
    revalidatePath("/sales/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { data: result };
  } catch (error) {
    logger.error("Failed to update sales return", error, { profileId, returnId });
    return { error: "Failed to update sales return" };
  }
}

export async function deleteSalesReturn(profileId: string, returnId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const salesReturn = await db.salesReturn.findFirst({
      where: { id: returnId, profileId },
      include: { items: true },
    });

    if (!salesReturn) return { error: "Sales return not found" };

    await db.$transaction(async (tx) => {
      // If the return was COMPLETED, reverse the inventory restoration
      if (salesReturn.status === "COMPLETED") {
        for (const item of salesReturn.items) {
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

      // If the return was COMPLETED and had a party transaction, remove it
      if (salesReturn.status === "COMPLETED" && salesReturn.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Sales Return #${salesReturn.returnNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, salesReturn.partyId);
      }

      // Delete the sales return (items will be deleted automatically due to Cascade)
      await tx.salesReturn.delete({
        where: { id: returnId },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/sales/returns");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete sales return", error, { profileId, returnId });
    return { error: "Failed to delete sales return" };
  }
}
