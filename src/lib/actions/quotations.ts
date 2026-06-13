"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getQuotations(profileId: string) {
  try {
    const quotations = await db.quotation.findMany({
      where: { profileId },
      include: {
        party: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    return { data: quotations };
  } catch (error) {
    logger.error("Failed to fetch quotations", error, { profileId });
    return { error: "Failed to fetch quotations" };
  }
}

export async function getQuotation(id: string, profileId: string) {
  try {
    const quotation = await db.quotation.findFirst({
      where: { id, profileId },
      include: {
        party: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
    });

    if (!quotation) {
      return { error: "Quotation not found" };
    }

    return { data: quotation };
  } catch (error) {
    logger.error("Failed to fetch quotation", error, { profileId, id });
    return { error: "Failed to fetch quotation" };
  }
}

export async function getNextQuotationNo(profileId: string) {
  try {
    const lastQuotation = await db.quotation.findFirst({
      where: { profileId },
      orderBy: { quotationNo: "desc" },
    });

    const nextNo = lastQuotation ? lastQuotation.quotationNo + 1 : 1;
    return { data: nextNo };
  } catch (error) {
    logger.error("Failed to get next quotation number", error, { profileId });
    return { error: "Failed to get next quotation number" };
  }
}

export async function createQuotation(profileId: string, data: {
  partyId?: string;
  items: Array<{ itemId?: string; name: string; quantity: number; rate: number; amount: number }>;
  totalAmount: number;
  discount: number;
  tax: number;
  grandTotal: number;
  remarks?: string;
  validUntil?: Date;
  date: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get next quotation number
    const nextQuotationNo = await getNextQuotationNo(profileId);
    if (nextQuotationNo.error) {
      return nextQuotationNo;
    }

    // Create quotation with items in a transaction
    const quotation = await db.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          profileId,
          quotationNo: nextQuotationNo.data as number,
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          status: "DRAFT",
          remarks: data.remarks,
          validUntil: data.validUntil,
          date: data.date,
        },
      });

      // Create quotation items
      await Promise.all(
        data.items.map((item) =>
          tx.quotationItem.create({
            data: {
              quotationId: newQuotation.id,
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            },
          })
        )
      );

      return newQuotation;
    });

    revalidatePath("/sales");
    revalidatePath("/sales/quotations");

    return { data: quotation };
  } catch (error) {
    logger.error("Failed to create quotation", error, { profileId });
    return { error: "Failed to create quotation" };
  }
}

export async function updateQuotation(
  id: string,
  profileId: string,
  data: {
    partyId?: string;
    items: Array<{ itemId?: string; name: string; quantity: number; rate: number; amount: number }>;
    totalAmount: number;
    discount: number;
    tax: number;
    grandTotal: number;
    remarks?: string;
    validUntil?: Date;
    status?: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Update quotation with items in a transaction
    const quotation = await db.$transaction(async (tx) => {
      // Delete existing items
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // Update quotation
      const updatedQuotation = await tx.quotation.update({
        where: { id, profileId },
        data: {
          partyId: data.partyId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          remarks: data.remarks,
          validUntil: data.validUntil,
          status: data.status,
        },
      });

      // Create new items
      await Promise.all(
        data.items.map((item) =>
          tx.quotationItem.create({
            data: {
              quotationId: id,
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            },
          })
        )
      );

      return updatedQuotation;
    });

    revalidatePath("/sales");
    revalidatePath("/sales/quotations");

    return { data: quotation };
  } catch (error) {
    logger.error("Failed to update quotation", error, { profileId, id });
    return { error: "Failed to update quotation" };
  }
}

export async function deleteQuotation(id: string, profileId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Check if quotation exists and can be deleted
    const quotation = await db.quotation.findFirst({
      where: { id, profileId },
    });

    if (!quotation) {
      return { error: "Quotation not found" };
    }

    // Prevent deletion of converted quotations
    if (quotation.status === "CONVERTED") {
      return { error: "Cannot delete a converted quotation. It has been converted to a sale." };
    }

    await db.quotation.delete({
      where: { id, profileId },
    });

    revalidatePath("/sales");
    revalidatePath("/sales/quotations");

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete quotation", error, { profileId, id });
    return { error: "Failed to delete quotation" };
  }
}

export async function convertQuotationToSale(
  quotationId: string,
  profileId: string,
  data: {
    paymentMethod: string;
    status: string;
    remarks?: string;
    date: Date;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get quotation details
    const quotation = await getQuotation(quotationId, profileId);
    if (quotation.error || !quotation.data) {
      return { error: "Quotation not found" };
    }

    // Get next invoice number
    const { getNextInvoiceNo } = await import("./sales");
    const nextInvoiceNo = await getNextInvoiceNo(profileId);
    if (nextInvoiceNo.error) {
      return nextInvoiceNo;
    }

    // Create sale from quotation in a transaction
    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          profileId,
          invoiceNo: nextInvoiceNo.data as number,
          partyId: quotation.data.partyId,
          totalAmount: quotation.data.totalAmount,
          discount: quotation.data.discount,
          tax: quotation.data.tax,
          grandTotal: quotation.data.grandTotal,
          paymentMethod: data.paymentMethod as any,
          status: data.status,
          remarks: data.remarks,
          date: data.date,
        },
      });

      // Create sale items from quotation items
      await Promise.all(
        quotation.data.items.map((item) =>
          tx.saleItem.create({
            data: {
              saleId: newSale.id,
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            },
          })
        )
      );

      // Update item stock quantities
      await Promise.all(
        quotation.data.items.map((item) =>
          tx.item.update({
            where: { id: item.itemId! },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      // Update quotation status
      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: "CONVERTED" },
      });

      return newSale;
    });

    revalidatePath("/sales");
    revalidatePath("/sales/quotations");

    return { data: sale };
  } catch (error) {
    logger.error("Failed to convert quotation to sale", error, { profileId, quotationId });
    return { error: "Failed to convert quotation to sale" };
  }
}
