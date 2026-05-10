"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, BalanceType, PaymentMethod } from "@prisma/client";
import { recalculatePartyBalance } from "./party";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getPurchases(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchases = await db.purchase.findMany({
      where: { profileId },
      include: {
        party: true,
        items: true,
      },
      orderBy: { date: "desc" },
    });
    
    // Convert Decimal to number
    const serializedPurchases = purchases.map(purchase => ({
      ...purchase,
      totalAmount: Number(purchase.totalAmount),
      discount: Number(purchase.discount),
      tax: Number(purchase.tax),
      grandTotal: Number(purchase.grandTotal),
      items: purchase.items.map(item => ({
        ...item,
        rate: Number(item.rate),
        amount: Number(item.amount)
      }))
    }));

    return { data: serializedPurchases };
  } catch (e) {
    console.error("[getPurchases]", e);
    return { error: "Failed to fetch purchases" };
  }
}

export async function createPurchase(
  profileId: string,
  data: {
    partyId?: string;
    items: { itemId?: string; name: string; quantity: number; rate: number; amount: number }[];
    totalAmount: number;
    discount: number;
    tax: number;
    grandTotal: number;
    receivedAmount?: number; // For purchases, this is "Paid Amount"
    paymentMethod: string;
    status: string;
    remarks?: string;
    date: Date;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    // Get next bill number
    const lastPurchase = await db.purchase.findFirst({
      where: { profileId },
      orderBy: { billNo: "desc" },
    });
    const billNo = (lastPurchase?.billNo || 0) + 1;

    // Use transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          profileId,
          billNo,
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          paymentMethod: data.paymentMethod as PaymentMethod,
          status: data.status,
          remarks: data.remarks,
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

      // Update inventory stock quantities
      for (const item of data.items) {
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
      
      // Record in Party Ledger if supplier is selected
      if (data.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
          where: { profileId, type: PartyTxType.PURCHASE },
          orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        // 1. Record the Purchase itself
        await tx.partyTransaction.create({
          data: {
            partyId: data.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.PURCHASE,
            amount: data.grandTotal,
            paymentMethod: data.paymentMethod as PaymentMethod,
            remarks: `Purchase Bill #${billNo}`,
            date: data.date,
          },
        });

        // 2. Record Payment Out if any amount was paid
        const paid = data.receivedAmount || (data.status === "PAID" ? data.grandTotal : 0);
        
        if (paid > 0) {
          await tx.partyTransaction.create({
            data: {
              partyId: data.partyId,
              profileId,
              receiptNumber: nextReceiptNo + 1,
              type: PartyTxType.PAYMENT_OUT,
              amount: paid,
              paymentMethod: data.paymentMethod as PaymentMethod,
              remarks: `Payment for Bill #${billNo}`,
              date: data.date,
            },
          });
        }

        // 3. Recalculate balance properly
        await recalculatePartyBalance(tx, data.partyId);
      }

      // Create a unified transaction record for the ledger
      await tx.transaction.create({
        data: {
          profileId,
          type: TransactionType.PURCHASE,
          referenceId: purchase.id,
          amount: data.grandTotal,
          description: `Purchase Bill #${billNo}`,
          date: data.date,
        }
      });

      return purchase;
    });

    revalidatePath("/purchase");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/parties");
    if (data.partyId) revalidatePath(`/parties/${data.partyId}`);
    return { 
      data: {
        ...result,
        totalAmount: Number(result.totalAmount),
        discount: Number(result.discount),
        tax: Number(result.tax),
        grandTotal: Number(result.grandTotal),
      } 
    };
  } catch (e) {
    console.error("[createPurchase]", e);
    return { error: "Failed to create purchase" };
  }
}

export async function deletePurchase(profileId: string, purchaseId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId, profileId },
      include: { items: true },
    });

    if (!purchase) return { error: "Purchase not found" };

    await db.$transaction(async (tx) => {
      // 1. Reverse inventory changes (decrement stock because a purchase is being deleted)
      for (const item of purchase.items) {
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

      // 2. Delete the unified transaction record
      await tx.transaction.deleteMany({
        where: { profileId, referenceId: purchaseId },
      });

      // 3. Delete the purchase (items will be deleted automatically due to Cascade)
      await tx.purchase.delete({
        where: { id: purchaseId },
      });
    });

    revalidatePath("/purchase");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("[deletePurchase]", e);
    return { error: "Failed to delete purchase" };
  }
}

