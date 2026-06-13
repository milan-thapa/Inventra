// src/lib/shared-utils.ts

/**
 * Computes a payment status from total received vs grand total.
 * Reused across sales, purchases, and payment-recording flows.
 */
export function computePaymentStatus(
  totalReceived: number,
  grandTotal: number,
): "PAID" | "PARTIAL" | "UNPAID" {
  if (totalReceived >= grandTotal) return "PAID";
  if (totalReceived > 0) return "PARTIAL";
  return "UNPAID";
}

/**
 * Serializes a sale/purchase-like record's Decimal fields to plain numbers.
 * Works for any object with totalAmount, discount, tax, grandTotal.
 */
export function serializeInvoiceDecimals<
  T extends {
    totalAmount: unknown;
    discount: unknown;
    tax: unknown;
    grandTotal: unknown;
  },
>(record: T) {
  return {
    ...record,
    totalAmount: Number(record.totalAmount),
    discount: Number(record.discount),
    tax: Number(record.tax),
    grandTotal: Number(record.grandTotal),
  };
}

/**
 * Serializes an array of line-item records that have rate & amount Decimal fields.
 */
export function serializeLineItems<
  T extends { rate: unknown; amount: unknown },
>(items: T[]) {
  return items.map((item) => ({
    ...item,
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));
}
