"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, BalanceType, PaymentMethod } from "@prisma/client";
import { recalculatePartyBalance } from "./party";
import { verifyProfile } from "@/lib/actions/shared";
import { serializeInvoiceDecimals, serializeLineItems } from "@/lib/shared-utils";

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
    
    const serializedPurchases = purchases.map(purchase => ({
      ...serializeInvoiceDecimals(purchase),
      items: serializeLineItems(purchase.items),
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
    return { data: serializeInvoiceDecimals(result) };
  } catch (e) {
    console.error("[createPurchase]", e);
    return { error: "Failed to create purchase" };
  }
}

// Payment out functions - disabled until schema is updated
// These require Purchase model to have: receivedAmount, payments relation
// and Payment model to have: purchaseId field

/*
export async function recordPaymentOut(
  profileId: string,
  purchaseId: string,
  data: {
    amount: number;
    paymentMethod: string;
    remarks?: string;
    date: Date;
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId, profileId },
      include: { payments: true, party: true },
    });

    if (!purchase) return { error: "Purchase not found" };

    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          profileId,
          purchaseId,
          partyId: purchase.partyId,
          amount: data.amount,
          paymentMethod: data.paymentMethod as PaymentMethod,
          remarks: data.remarks,
          date: data.date,
        },
      });

      // Update purchase received amount
      const totalPaid = purchase.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount;
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          receivedAmount: totalPaid,
          status: totalPaid >= Number(purchase.grandTotal) ? "PAID" : 
                 totalPaid > 0 ? "PARTIAL" : "UNPAID",
        },
      });

      // Record party transaction if party exists
      if (purchase.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
          where: { profileId, type: PartyTxType.PAYMENT_OUT },
          orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        await tx.partyTransaction.create({
          data: {
            partyId: purchase.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.PAYMENT_OUT,
            amount: data.amount,
            paymentMethod: data.paymentMethod as PaymentMethod,
            remarks: `Payment for Purchase Bill #${purchase.billNo}`,
            date: data.date,
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, purchase.partyId);
      }

      return payment;
    });

    revalidatePath("/purchase");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    if (purchase.partyId) revalidatePath(`/parties/${purchase.partyId}`);

    return { data: result };
  } catch (e) {
    console.error("[recordPaymentOut]", e);
    return { error: "Failed to record payment out" };
  }
}

export async function deletePaymentOut(profileId: string, paymentId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId, profileId },
      include: { purchase: { include: { payments: true, party: true } } },
    });

    if (!payment) return { error: "Payment not found" };

    await db.$transaction(async (tx) => {
      // Delete party transaction if exists
      if (payment.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Payment for Purchase Bill #${payment.purchase?.billNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, payment.partyId);
      }

      // Update purchase received amount
      if (payment.purchase) {
        const remainingPayments = payment.purchase.payments.filter(p => p.id !== paymentId);
        const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        await tx.purchase.update({
          where: { id: payment.purchaseId },
          data: {
            receivedAmount: totalPaid,
            status: totalPaid >= Number(payment.purchase.grandTotal) ? "PAID" : 
                   totalPaid > 0 ? "PARTIAL" : "UNPAID",
          },
        });
      }

      // Delete payment
      await tx.payment.delete({
        where: { id: paymentId },
      });
    });

    revalidatePath("/purchase");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    if (payment.partyId) revalidatePath(`/parties/${payment.partyId}`);

    return { success: true };
  } catch (e) {
    console.error("[deletePaymentOut]", e);
    return { error: "Failed to delete payment out" };
  }
}
*/

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

      // 2. Delete party transactions associated with this purchase
      if (purchase.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            partyId: purchase.partyId,
            profileId,
            remarks: { contains: `Bill #${purchase.billNo}` },
          },
        });
        // Recalculate party balance after deleting transactions
        await recalculatePartyBalance(tx, purchase.partyId);
      }

      // 3. Delete the unified transaction record
      await tx.transaction.deleteMany({
        where: { profileId, referenceId: purchaseId },
      });

      // 4. Delete the purchase (items will be deleted automatically due to Cascade)
      await tx.purchase.delete({
        where: { id: purchaseId },
      });
    });

    revalidatePath("/purchase");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    return { success: true };
  } catch (e) {
    console.error("[deletePurchase]", e);
    return { error: "Failed to delete purchase" };
  }
}

