"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartyTxType, TransactionType, BalanceType, PaymentMethod } from "@prisma/client";
import { recalculatePartyBalance } from "./party";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/ratelimit";
import { withErrorHandler, UnauthorizedError, ValidationError } from "@/lib/error-handler";
import { createSaleSchema, recordPaymentSchema } from "@/lib/validations/sales";
import { verifyProfile } from "@/lib/actions/shared";
import { computePaymentStatus, serializeInvoiceDecimals, serializeLineItems } from "@/lib/shared-utils";

function serializeSaleRecord(sale: {
  payments: { amount: unknown }[];
  grandTotal: unknown;
  receivedAmount: unknown;
  status: string;
  party: { openingBalance: unknown } | null;
  items: { rate: unknown; amount: unknown }[];
  totalAmount: unknown;
  discount: unknown;
  tax: unknown;
  [key: string]: unknown;
}) {
  const totalReceived = sale.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const grandTotal = Number(sale.grandTotal);
  const remainingAmount = grandTotal - totalReceived;
  const status =
    sale.payments.length > 0
      ? computePaymentStatus(totalReceived, grandTotal)
      : sale.status;

  return {
    ...serializeInvoiceDecimals(sale as any),
    receivedAmount: Number(sale.receivedAmount || 0),
    totalReceived,
    remainingAmount,
    status,
    party: sale.party
      ? { ...sale.party, openingBalance: Number(sale.party.openingBalance) }
      : null,
    items: serializeLineItems(sale.items as any),
    payments: sale.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

export async function getSale(profileId: string, saleId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const sale = await db.sale.findFirst({
      where: { id: saleId, profileId },
      include: {
        party: true,
        items: true,
        payments: true,
      },
    });

    if (!sale) return { error: "Sale not found" };

    return { data: serializeSaleRecord(sale) };
  } catch (e) {
    console.error("[getSale]", e);
    return { error: "Failed to fetch sale" };
  }
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
        payments: true,
      },
      orderBy: { date: "desc" },
    });

    return { data: sales.map(serializeSaleRecord) };
  } catch (e) {
    console.error("[getSales]", e);
    return { error: "Failed to fetch sales" };
  }
}

export async function getNextInvoiceNo(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const lastSale = await db.sale.findFirst({
      where: { profileId },
      orderBy: { invoiceNo: "desc" },
      select: { invoiceNo: true },
    });
    return { data: (lastSale?.invoiceNo || 0) + 1 };
  } catch (e) {
    console.error("[getNextInvoiceNo]", e);
    return { error: "Failed to fetch invoice number" };
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
    receivedAmount?: number;
    paymentMethod: string;
    status: string;
    remarks?: string;
    invoiceNo?: number;
    date: Date;
    dueDate?: Date;
  }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError();

    // Apply rate limiting for sale creation
    await withRateLimit(session.user.id, "createSale", () => Promise.resolve(), 20, 60 * 1000);

    // Validate input
    const validatedData = createSaleSchema.parse(data);

    const profile = await verifyProfile(profileId);
    if (!profile) throw new UnauthorizedError();
    // Check credit limit if party is selected
    if (data.partyId) {
      const party = await db.party.findUnique({
        where: { id: data.partyId, profileId },
      });

      if (party && Number(party.creditLimit) > 0) {
        const currentBalance = Number(party.openingBalance);
        const newBalance = currentBalance + data.grandTotal;
        
        if (newBalance > Number(party.creditLimit)) {
          return { 
            error: `Credit limit exceeded. Current balance: ${currentBalance}, New balance would be: ${newBalance}, Credit limit: ${party.creditLimit}` 
          };
        }
      }
    }

    // Apply applicable discounts
    let calculatedDiscount = data.discount;
    const activeDiscounts = await db.discount.findMany({
      where: { 
        profileId,
        isActive: true,
        OR: [
          { startDate: { lte: new Date() } },
          { startDate: null }
        ],
        AND: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
      },
    });

    for (const discount of activeDiscounts) {
      if (discount.type === "PERCENTAGE") {
        const discountAmount = data.totalAmount * (Number(discount.value) / 100);
        calculatedDiscount += discountAmount;
      } else if (discount.type === "FIXED_AMOUNT") {
        calculatedDiscount += Number(discount.value);
      }
    }

    const method = data.paymentMethod.toLowerCase().includes("cash") ? "CASH" : "BANK";

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
          invoiceNo: data.invoiceNo || invoiceNo,
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          paymentMethod: method as PaymentMethod,
          status: data.status,
          remarks: data.remarks,
          date: data.date,
          dueDate: data.dueDate,
          receivedAmount: data.receivedAmount || (data.status === "PAID" ? data.grandTotal : 0),
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
            paymentMethod: method as PaymentMethod,
            remarks: `Sale Invoice #${invoiceNo}`,
            date: data.date,
          },
        });

        // 2. Record Payment if any amount was received
        const received = data.receivedAmount || (data.status === "PAID" ? data.grandTotal : 0);
        
        if (received > 0) {
          await tx.partyTransaction.create({
            data: {
              partyId: data.partyId,
              profileId,
              receiptNumber: nextReceiptNo + 1,
              type: PartyTxType.PAYMENT_IN,
              amount: received,
              paymentMethod: method as PaymentMethod,
              remarks: `Payment for Invoice #${invoiceNo}`,
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
    return { data: serializeInvoiceDecimals(result) };
  }, "createSale");
}

export async function recordPayment(
  profileId: string,
  saleId: string,
  data: {
    amount: number;
    paymentMethod: string;
    remarks?: string;
    date: Date;
  }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError();

    // Apply rate limiting for payment recording
    await withRateLimit(session.user.id, "recordPayment", () => Promise.resolve(), 30, 60 * 1000);

    // Validate input
    const validatedData = recordPaymentSchema.parse(data);

    const profile = await verifyProfile(profileId);
    if (!profile) throw new UnauthorizedError();
    const sale = await db.sale.findUnique({
      where: { id: saleId, profileId },
      include: { payments: true, party: true },
    });

    if (!sale) return { error: "Sale not found" };

    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          profileId,
          saleId,
          partyId: sale.partyId,
          amount: data.amount,
          paymentMethod: data.paymentMethod as PaymentMethod,
          remarks: data.remarks,
          date: data.date,
        },
      });

      // Update sale received amount
      const totalReceived = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount;
      await tx.sale.update({
        where: { id: saleId },
        data: {
          receivedAmount: totalReceived,
          status: computePaymentStatus(totalReceived, Number(sale.grandTotal)),
        },
      });

      // Record party transaction if party exists
      if (sale.partyId) {
        const lastPartyTx = await tx.partyTransaction.findFirst({
          where: { profileId, type: PartyTxType.PAYMENT_IN },
          orderBy: { receiptNumber: "desc" },
        });
        const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

        await tx.partyTransaction.create({
          data: {
            partyId: sale.partyId,
            profileId,
            receiptNumber: nextReceiptNo,
            type: PartyTxType.PAYMENT_IN,
            amount: data.amount,
            paymentMethod: data.paymentMethod as PaymentMethod,
            remarks: `Payment for Invoice #${sale.invoiceNo}`,
            date: data.date,
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, sale.partyId);
      }

      return payment;
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    if (sale.partyId) revalidatePath(`/parties/${sale.partyId}`);

    return { data: result };
  }, "recordPayment");
}

export async function deletePayment(profileId: string, paymentId: string) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError();

    const profile = await verifyProfile(profileId);
    if (!profile) throw new UnauthorizedError();
    const payment = await db.payment.findUnique({
      where: { id: paymentId, profileId },
      include: { sale: { include: { payments: true, party: true } } },
    });

    if (!payment) return { error: "Payment not found" };

    await db.$transaction(async (tx) => {
      // Delete party transaction if exists
      if (payment.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Payment for Invoice #${payment.sale?.invoiceNo}` },
          },
        });

        // Recalculate party balance
        await recalculatePartyBalance(tx, payment.partyId);
      }

      // Update sale received amount
      if (payment.sale) {
        const remainingPayments = payment.sale.payments.filter(p => p.id !== paymentId);
        const totalReceived = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        await tx.sale.update({
          where: { id: payment.saleId },
          data: {
            receivedAmount: totalReceived,
            status: computePaymentStatus(totalReceived, Number(payment.sale.grandTotal)),
          },
        });
      }

      // Delete payment
      await tx.payment.delete({
        where: { id: paymentId },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    if (payment.partyId) revalidatePath(`/parties/${payment.partyId}`);

    return { success: true };
  }, "deletePayment");
}

export async function deleteSale(profileId: string, saleId: string) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError();

    // Apply rate limiting for sale deletion
    await withRateLimit(session.user.id, "deleteSale", () => Promise.resolve(), 10, 60 * 1000);

    const profile = await verifyProfile(profileId);
    if (!profile) throw new UnauthorizedError();
    const sale = await db.sale.findUnique({
      where: { id: saleId, profileId },
      include: { items: true, payments: true },
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

      // 2. Delete party transactions associated with this sale
      if (sale.partyId) {
        await tx.partyTransaction.deleteMany({
          where: {
            partyId: sale.partyId,
            profileId,
            remarks: { contains: `Invoice #${sale.invoiceNo}` },
          },
        });
        // Recalculate party balance after deleting transactions
        await recalculatePartyBalance(tx, sale.partyId);
      }

      // 3. Delete the unified transaction record
      await tx.transaction.deleteMany({
        where: { profileId, referenceId: saleId },
      });

      // 4. Delete payments associated with this sale
      await tx.payment.deleteMany({
        where: { saleId },
      });

      // 5. Delete the sale (items will be deleted automatically due to Cascade)
      await tx.sale.delete({
        where: { id: saleId },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/parties");
    return { success: true };
  }, "deleteSale");
}

export async function updateSale(
  profileId: string,
  saleId: string,
  data: {
    partyId?: string;
    items: { itemId?: string; name: string; quantity: number; rate: number; amount: number }[];
    totalAmount: number;
    discount: number;
    tax: number;
    grandTotal: number;
    paymentMethod: string;
    status: string;
    remarks?: string;
    date: Date;
    dueDate?: Date;
  }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new UnauthorizedError();

    // Apply rate limiting for sale updates
    await withRateLimit(session.user.id, "updateSale", () => Promise.resolve(), 20, 60 * 1000);

    // Validate input
    const validatedData = createSaleSchema.parse(data);

    const profile = await verifyProfile(profileId);
    if (!profile) throw new UnauthorizedError();
    const method = data.paymentMethod.toLowerCase().includes("cash") ? "CASH" : "BANK";

    const result = await db.$transaction(async (tx) => {
      // Get existing sale with items
      const existingSale = await tx.sale.findUnique({
        where: { id: saleId, profileId },
        include: { items: true },
      });

      if (!existingSale) throw new Error("Sale not found");

      // Calculate inventory differences
      const existingItemMap = new Map<string, number>(
        existingSale.items
          .filter(item => item.itemId !== null)
          .map(item => [item.itemId as string, item.quantity])
      );
      const newItemMap = new Map<string, number>(
        data.items
          .filter(item => item.itemId !== undefined && item.itemId !== null)
          .map(item => [item.itemId as string, item.quantity])
      );

      // Update inventory based on quantity changes
      for (const [itemId, newQty] of newItemMap) {
        if (itemId) {
          const oldQty = existingItemMap.get(itemId) || 0;
          const diff = oldQty - newQty;
          
          if (diff > 0) {
            // Quantity decreased - add back to inventory
            await tx.item.update({
              where: { id: itemId },
              data: { stockQuantity: { increment: diff } },
            });
          } else if (diff < 0) {
            // Quantity increased - remove from inventory
            await tx.item.update({
              where: { id: itemId },
              data: { stockQuantity: { decrement: Math.abs(diff) } },
            });
          }
        }
      }

      // Handle removed items (add back to inventory)
      for (const [itemId, oldQty] of existingItemMap) {
        if (!newItemMap.has(itemId)) {
          await tx.item.update({
            where: { id: itemId as string },
            data: { stockQuantity: { increment: oldQty } },
          });
        }
      }

      // Delete existing sale items
      await tx.saleItem.deleteMany({
        where: { saleId },
      });

      // Update sale
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          paymentMethod: method as PaymentMethod,
          status: data.status,
          remarks: data.remarks,
          date: data.date,
          dueDate: data.dueDate,
        },
      });

      // Create new sale items
      await Promise.all(
        data.items.map((item) =>
          tx.saleItem.create({
            data: {
              saleId,
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            },
          })
        )
      );

      // Update party transactions if party changed or amounts changed
      if (data.partyId || existingSale.partyId) {
        // Delete old party transactions for this sale
        await tx.partyTransaction.deleteMany({
          where: {
            profileId,
            remarks: { contains: `Invoice #${existingSale.invoiceNo}` },
          },
        });

        // Create new party transactions if party is selected
        if (data.partyId) {
          const lastPartyTx = await tx.partyTransaction.findFirst({
            where: { profileId, type: PartyTxType.SALE },
            orderBy: { receiptNumber: "desc" },
          });
          const nextReceiptNo = (lastPartyTx?.receiptNumber ?? 0) + 1;

          // Record the Sale
          await tx.partyTransaction.create({
            data: {
              partyId: data.partyId,
              profileId,
              receiptNumber: nextReceiptNo,
              type: PartyTxType.SALE,
              amount: data.grandTotal,
              paymentMethod: method as PaymentMethod,
              remarks: `Sale Invoice #${existingSale.invoiceNo}`,
              date: data.date,
            },
          });

          // Recalculate party balance
          await recalculatePartyBalance(tx, data.partyId);
        }

        // Recalculate old party balance if party changed
        if (existingSale.partyId && existingSale.partyId !== data.partyId) {
          await recalculatePartyBalance(tx, existingSale.partyId);
        }
      }

      // Update unified transaction
      await tx.transaction.updateMany({
        where: { profileId, referenceId: saleId },
        data: {
          amount: data.grandTotal,
          description: `Sale Invoice #${existingSale.invoiceNo}`,
          date: data.date,
        },
      });

      return updatedSale;
    }, {
      timeout: 20000,
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/parties");

    return { data: serializeInvoiceDecimals(result) };
  }, "updateSale");
}

