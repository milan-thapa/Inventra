"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
                decrement: item.quantity,
              },
            },
          });
        }
      }
      
      // Optionally update party balances (TO_RECEIVE) if it's UNPAID/PARTIAL
      // Simplified for now: just recording the sale

      // Create a unified transaction record for the ledger
      await tx.transaction.create({
        data: {
          profileId,
          type: "INCOME", // Or maybe create a new TransactionType like SALE
          referenceId: sale.id,
          amount: data.grandTotal,
          description: `Sale Invoice #${invoiceNo}`,
          date: data.date,
        }
      });

      return sale;
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

