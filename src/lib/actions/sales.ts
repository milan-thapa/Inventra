"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, BalanceType, PaymentMethod } from "@prisma/client";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getSales(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const sales = await db.sale.findMany({
      where: { profileId },
      include: {
        party: true,
        items: true,
      },
      orderBy: { date: "desc" },
    });
    
    // Convert Decimal to number
    const serializedSales = sales.map(sale => ({
      ...sale,
      totalAmount: Number(sale.totalAmount),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      grandTotal: Number(sale.grandTotal),
      party: sale.party ? {
        ...sale.party,
        openingBalance: Number(sale.party.openingBalance)
      } : null,
      items: sale.items.map(item => ({
        ...item,
        rate: Number(item.rate),
        amount: Number(item.amount)
      }))
    }));

    return { data: serializedSales };
  } catch (e) {
    console.error("[getSales]", e);
    return { error: "Failed to fetch sales" };
  }
}

export async function createSale(
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
    // Use transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Get next invoice number inside transaction to prevent race conditions
      const lastSale = await tx.sale.findFirst({
        where: { profileId },
        orderBy: { invoiceNo: "desc" },
      });
      const invoiceNo = (lastSale?.invoiceNo || 0) + 1;

      const sale = await tx.sale.create({
        data: {
          profileId,
          invoiceNo,
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
              itemId: item.itemId || null,
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
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Record in Party Ledger if customer is selected
      if (data.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
            where: { profileId, type: PartyTxType.SALE },
            orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        // 1. Record the Sale itself
        await tx.partyTransaction.create({
          data: {
            partyId: data.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.SALE,
            amount: data.grandTotal,
            paymentMethod: data.paymentMethod as PaymentMethod,
            remarks: `Sale Invoice #${invoiceNo}`,
            date: data.date,
          },
        });

        // 2. If PAID, record the payment received immediately
        if (data.status === "PAID") {
          await tx.partyTransaction.create({
            data: {
              partyId: data.partyId,
              profileId,
              receiptNumber: nextReceiptNo + 1,
              type: PartyTxType.PAYMENT_IN,
              amount: data.grandTotal,
              paymentMethod: data.paymentMethod as PaymentMethod,
              remarks: `Payment for Invoice #${invoiceNo}`,
              date: data.date,
            },
          });
        }

        // 3. Update party balance atomically
        const delta = data.status === "PAID" ? 0 : data.grandTotal; // If PAID, net change is 0. If UNPAID, they owe more (+).
        
        if (delta !== 0) {
            const party = await tx.party.findUnique({ where: { id: data.partyId } });
            if (party) {
                // Calculate current net balance
                let currentBalance = party.balanceType === "TO_RECEIVE" ? Number(party.openingBalance) : -Number(party.openingBalance);
                let newBalance = currentBalance + delta;
                
                const newBalanceType = newBalance > 0 ? BalanceType.TO_RECEIVE : newBalance < 0 ? BalanceType.TO_GIVE : BalanceType.SETTLED;
                
                await tx.party.update({
                    where: { id: data.partyId },
                    data: {
                        openingBalance: Math.abs(newBalance),
                        balanceType: newBalanceType,
                    },
                });
            }
        }
      }

      // Create a unified transaction record for the ledger
      await tx.transaction.create({
        data: {
          profileId,
          type: TransactionType.SALE,
          referenceId: sale.id,
          amount: data.grandTotal,
          description: `Sale Invoice #${invoiceNo}`,
          date: data.date,
        }
      });

      return sale;
    }, {
      timeout: 20000, // Increase timeout to 20 seconds to handle ledger recalculations
    });

    revalidatePath("/sales");
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
    console.error("[createSale]", e);
    return { error: "Failed to create sale" };
  }
}

export async function deleteSale(profileId: string, saleId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const sale = await db.sale.findUnique({
      where: { id: saleId, profileId },
      include: { items: true },
    });

    if (!sale) return { error: "Sale not found" };

    await db.$transaction(async (tx) => {
      // 1. Reverse inventory changes (increment stock because a sale is being deleted)
      for (const item of sale.items) {
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

      // 2. Delete the unified transaction record
      await tx.transaction.deleteMany({
        where: { profileId, referenceId: saleId },
      });

      // 3. Delete the sale (items will be deleted automatically due to Cascade)
      await tx.sale.delete({
        where: { id: saleId },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("[deleteSale]", e);
    return { error: "Failed to delete sale" };
  }
}

