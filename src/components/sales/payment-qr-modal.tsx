// src/components/sales/payment-qr-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Smartphone, Wallet, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PaymentQRModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: "CASH" | "BANK") => void;
  amount: number;
  currency?: string;
  businessName: string;
}

export function PaymentQRModal({ open, onClose, onConfirm, amount, currency, businessName }: PaymentQRModalProps) {
  const [method, setMethod] = useState<"KHALTI" | "ESEWA" | "FONEPAY" | null>(null);

  const getQRUrl = (type: string) => {
    // In a real app, these would be merchant-specific IDs.
    // For now, we generate a dynamic QR with the amount for demonstration.
    const text = `${type}|${businessName}|${amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Collect Payment</DialogTitle>
          <DialogDescription>
            Select a payment method to generate a dynamic QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-secondary/30 rounded-2xl p-6 text-center mb-6">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Amount to Collect</p>
            <p className="text-3xl font-black text-indigo-600 font-mono">
              {formatCurrency(amount, currency)}
            </p>
          </div>

          {!method ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMethod("ESEWA")}
                className="flex flex-col items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/20 rounded-2xl hover:border-emerald-500 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                    <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="object-contain" />
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">eSewa QR</span>
              </button>

              <button 
                onClick={() => setMethod("KHALTI")}
                className="flex flex-col items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-500/20 rounded-2xl hover:border-purple-500 transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                    <img src="https://khalti.com/static/img/logo1.png" alt="Khalti" className="object-contain" />
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Khalti QR</span>
              </button>

              <button 
                onClick={() => setMethod("FONEPAY")}
                className="flex flex-col items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-500/20 rounded-2xl hover:border-rose-500 transition-all group col-span-2"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-8 h-8 text-rose-500" />
                </div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Fonepay / All Bank QR</span>
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-2"
            >
              <div className="bg-white p-4 rounded-3xl shadow-xl mb-4 border-4 border-indigo-600/10">
                <img src={getQRUrl(method)} alt="Payment QR" className="w-48 h-48" />
              </div>
              <p className="text-sm font-bold mb-1">Scan with your {method} App</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">Once the customer confirms the payment, click the confirm button below.</p>
              
              <div className="flex gap-2 w-full mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>Back</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onConfirm("BANK")}>
                  <Check className="w-4 h-4 mr-2" /> Received
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
