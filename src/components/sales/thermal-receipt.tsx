// src/components/sales/thermal-receipt.tsx
"use client";

import { cn, formatCurrency } from "@/lib/utils";

interface ThermalReceiptProps {
  businessName: string;
  address?: string;
  phone?: string;
  invoiceNo: string;
  date: Date;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency?: string;
}

export function ThermalReceipt({
  businessName,
  address,
  phone,
  invoiceNo,
  date,
  items,
  subtotal,
  tax,
  discount,
  total,
  currency = "Rs.",
}: ThermalReceiptProps) {
  return (
    <div id="thermal-receipt" className="hidden print:block w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[12px] leading-tight">
      <div className="text-center space-y-1 mb-4">
        <h1 className="text-sm font-bold uppercase">{businessName}</h1>
        {address && <p>{address}</p>}
        {phone && <p>Tel: {phone}</p>}
        <div className="border-b border-black border-dashed my-2" />
        <p className="font-bold">INVOICE: #{invoiceNo}</p>
        <p>{new Date(date).toLocaleString()}</p>
      </div>

      <table className="w-full text-left">
        <thead className="border-b border-black border-dashed">
          <tr>
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-black/10">
              <td className="py-1 truncate max-w-[30mm]">{item.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">{Number(item.rate).toFixed(0)}</td>
              <td className="py-1 text-right">{(item.quantity * Number(item.rate)).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed mt-4 pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(tax, currency)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(discount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-black mt-1 pt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
      </div>

      <div className="text-center mt-6 space-y-2">
        <div className="border-b border-black border-dashed" />
        <p className="text-[10px] uppercase font-bold">Thank you for your business!</p>
        <p className="text-[8px]">Powered by Inventra</p>
      </div>

      {/* CSS for print sizing */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
    </div>
  );
}
