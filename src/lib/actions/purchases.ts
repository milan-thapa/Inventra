"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    paymentMethod: "CASH" | "BANK";
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
          paymentMethod: data.paymentMethod,
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
      
      // Optionally update party balances (TO_GIVE) if it's UNPAID/PARTIAL
      // Simplified for now: just recording the purchase

      // Create a unified transaction record for the ledger
      await tx.transaction.create({
        data: {
          profileId,
          type: "EXPENSE", // Or maybe create a new TransactionType like PURCHASE
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

