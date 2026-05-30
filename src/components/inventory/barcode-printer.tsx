"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BarcodePrinterProps {
  open: boolean;
  onClose: () => void;
  items: Array<{
    id: string;
    name: string;
    barcode?: string;
    sku?: string;
    sellingPrice: number;
    stockQuantity: number;
    unit?: string;
  }>;
  currency?: string;
  currencyPos?: string;
}

export function BarcodePrinter({
  open,
  onClose,
  items,
  currency = "Rs.",
  currencyPos = "start"
}: BarcodePrinterProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [barcodesReady, setBarcodesReady] = useState(false);

  useEffect(() => {
    if (open && items.length > 0) {
      setBarcodesReady(false);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        items.forEach((item, index) => {
          if (item.barcode && canvasRefs.current[index]) {
            try {
              JsBarcode(canvasRefs.current[index]!, item.barcode, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 10,
                lineColor: "#000000",
                background: "#FFFFFF",
              });
            } catch (error) {
              console.error("Failed to generate barcode:", error);
            }
          }
        });
        setBarcodesReady(true);
      }, 100);
    }
  }, [open, items]);

  const formatCurrency = (amount: number) => {
    if (currencyPos === "start") {
      return `${currency}${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)}${currency}`;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = items.map((item, index) => {
      if (!item.barcode) return "";
      
      const canvas = canvasRefs.current[index];
      const barcodeDataUrl = canvas?.toDataURL("image/png") || "";
      
      return `
        <div class="barcode-label" style="
          width: 2in;
          height: 1in;
          border: 1px solid #000;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          page-break-inside: avoid;
          margin-bottom: 8px;
        ">
          <div style="width: 100%; text-align: center;">
            <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${item.name}
            </div>
            ${item.sku ? `<div style="font-size: 8px; color: #666;">SKU: ${item.sku}</div>` : ""}
          </div>
          <img src="${barcodeDataUrl}" style="width: 100%; height: 40px; object-fit: contain;" />
          <div style="width: 100%; display: flex; justify-content: space-between; font-size: 9px;">
            <span>${formatCurrency(item.sellingPrice)}</span>
            <span>Stock: ${item.stockQuantity} ${item.unit || "PCS"}</span>
          </div>
        </div>
      `;
    }).join("");

    const printStyles = `
      <style>
        @page {
          size: auto;
          margin: 0.5in;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .barcode-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes</title>
          ${printStyles}
        </head>
        <body>
          <div class="barcode-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    items.forEach((item, index) => {
      if (!item.barcode || !canvasRefs.current[index]) return;
      
      const canvas = canvasRefs.current[index];
      const link = document.createElement("a");
      link.download = `barcode-${item.name.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const itemsWithBarcodes = items.filter(item => item.barcode);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-xl p-0 overflow-hidden border border-border max-h-[80vh] flex flex-col">
        <DialogHeader className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground">
              Print Barcodes ({itemsWithBarcodes.length} items)
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {itemsWithBarcodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No items with barcodes to print
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {itemsWithBarcodes.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-3 bg-card"
                >
                  <div className="text-center mb-2">
                    <p className="text-xs font-semibold text-foreground truncate mb-1">
                      {item.name}
                    </p>
                    {item.sku && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.sku}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-center mb-2">
                    <canvas
                      ref={(el) => { canvasRefs.current[index] = el; }}
                      className="max-w-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatCurrency(item.sellingPrice)}</span>
                    <span>{item.stockQuantity} {item.unit || "PCS"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {itemsWithBarcodes.length > 0 && (
          <div className="px-5 py-3 border-t border-border/50 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!barcodesReady}
              className="h-9 text-xs gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Images
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!barcodesReady}
              className="h-9 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Barcodes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
