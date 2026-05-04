"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Printer, Plus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface CheckoutSuccessModalProps {
  open: boolean;
  onClose: () => void;
  onNewSale: () => void;
  onPrint: () => void;
  saleData: {
    invoiceNo: string;
    grandTotal: number;
    paymentMethod: string;
  } | null;
  currency?: string;
}

export function CheckoutSuccessModal({ 
  open, 
  onClose, 
  onNewSale, 
  onPrint, 
  saleData, 
  currency 
}: CheckoutSuccessModalProps) {
  if (!saleData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl border"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-emerald-500 rounded-full"
            />
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1">Payment Successful!</h2>
          <p className="text-muted-foreground text-sm mb-6 uppercase tracking-widest font-bold">Invoice #{saleData.invoiceNo}</p>

          <div className="w-full bg-secondary/30 rounded-3xl p-6 mb-8 border border-border/50">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Amount Received</p>
            <p className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">
              {formatCurrency(saleData.grandTotal, currency)}
            </p>
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                    {saleData.paymentMethod}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                    FULLY PAID
                </span>
            </div>
          </div>

          <div className="grid grid-cols-1 w-full gap-3">
            <Button 
                onClick={onPrint} 
                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2"
            >
              <Printer className="w-4 h-4" /> Print Thermal Receipt
            </Button>
            <Button 
                onClick={onNewSale} 
                variant="outline" 
                className="h-12 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-2xl font-bold gap-2"
            >
              <Plus className="w-4 h-4" /> Start New Sale
            </Button>
          </div>

          <button onClick={onClose} className="mt-6 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            Close Window
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
