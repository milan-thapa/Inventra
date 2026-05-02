// src/components/parties/add-payment-in-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addPaymentIn, getParties } from "@/lib/actions/party";
import { addPaymentInSchema, type AddPaymentInInput } from "@/lib/validations/party";
import { formatCurrency } from "@/lib/utils";

export function AddPaymentInModal({
  open,
  onClose,
  profileId,
  defaultPartyId,
  defaultPartyName,
  defaultBalance,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  defaultPartyId?: string;
  defaultPartyName?: string;
  defaultBalance?: number;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveNew, setSaveNew] = useState(false);
  const [parties, setParties] = useState<{ id: string; name: string; openingBalance: number | string }[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<AddPaymentInInput>({
      resolver: zodResolver(addPaymentInSchema),
      defaultValues: {
        partyId: defaultPartyId ?? "",
        receiptNumber: 1,
        paymentMethod: "CASH",
        date: new Date(),
      },
    });

  const selectedPartyId = watch("partyId");
  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  useEffect(() => {
    if (open) {
      getParties(profileId).then((res) => {
        if (res.data) {
          setParties(res.data.map(p => ({ ...p, openingBalance: Number(p.openingBalance) })));
        }
      });
    }
  }, [open, profileId]);

  const onSubmit = async (data: AddPaymentInInput) => {
    setLoading(true);
    const res = await addPaymentIn(profileId, data);
    setLoading(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Payment In saved successfully" });
      if (saveNew) {
        reset({ partyId: defaultPartyId ?? "", paymentMethod: "CASH", date: new Date(), receiptNumber: (data.receiptNumber ?? 0) + 1 });
      } else {
        onClose();
        onSuccess?.();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-bold text-foreground">Add Payment In</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Receipt No + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground">Receipt Number</Label>
                      <button type="button" className="text-xs text-emerald-500">Manual</button>
                    </div>
                    <Input {...register("receiptNumber", { valueAsNumber: true })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]}
                      {...register("date", { valueAsDate: true })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>
                </div>

                {/* Party Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs text-muted-foreground">Party Name</Label>
                    {selectedParty && (
                      <span className="text-xs text-emerald-500 font-semibold">
                        {formatCurrency(Number(selectedParty.openingBalance))}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select {...register("partyId")}
                      className="w-full h-9 pl-3 pr-8 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
                      <option value="">Search for party</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.partyId && <p className="text-xs text-destructive mt-1">{errors.partyId.message}</p>}
                </div>

                {/* Amount + Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Received Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                      <Input type="number" step="0.01" placeholder="0.00"
                        {...register("amount", { valueAsNumber: true })}
                        className="h-9 text-sm bg-muted/50 border-border/50 pl-10" />
                    </div>
                    {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Method</Label>
                    <select {...register("paymentMethod")}
                      className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank</option>
                    </select>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Remarks</Label>
                  <textarea {...register("remarks")} placeholder="Enter remarks here..." rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-emerald-500 outline-none" />
                </div>

                {/* Camera */}
                <button type="button"
                  className="flex items-center justify-center w-14 h-14 bg-muted/50 border border-dashed border-border rounded-xl hover:border-emerald-500 transition-colors">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1 h-10 border-border/50"
                    onClick={() => { setSaveNew(true); handleSubmit(onSubmit)(); }} disabled={loading}>
                    Save &amp; New
                  </Button>
                  <Button type="submit"
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => setSaveNew(false)} disabled={loading}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Save Payment In
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────
// Payment Out Modal (mirrors Payment In)
// ─────────────────────────────────────────────────────────

import { addPaymentOut } from "@/lib/actions/party";

export function AddPaymentOutModal({
  open,
  onClose,
  profileId,
  defaultPartyId,
  defaultPartyName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  defaultPartyId?: string;
  defaultPartyName?: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<{ id: string; name: string; openingBalance: number | string }[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<AddPaymentInInput>({
      resolver: zodResolver(addPaymentInSchema),
      defaultValues: {
        partyId: defaultPartyId ?? "",
        receiptNumber: 1,
        paymentMethod: "CASH",
        date: new Date(),
      },
    });

  useEffect(() => {
    if (open) {
      getParties(profileId).then((res) => {
        if (res.data) {
          setParties(res.data.map(p => ({ ...p, openingBalance: Number(p.openingBalance) })));
        }
      });
    }
  }, [open, profileId]);

  const onSubmit = async (data: AddPaymentInInput) => {
    setLoading(true);
    const res = await addPaymentOut(profileId, data);
    setLoading(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Payment Out saved successfully" });
      onClose();
      onSuccess?.();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-bold text-foreground">Add Payment Out</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground">Receipt Number</Label>
                      <button type="button" className="text-xs text-emerald-500">Manual</button>
                    </div>
                    <Input {...register("receiptNumber", { valueAsNumber: true })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]}
                      {...register("date", { valueAsDate: true })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Party Name</Label>
                  <select {...register("partyId")}
                    className="w-full h-9 pl-3 pr-8 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
                    <option value="">Search for party</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Paid Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                      <Input type="number" step="0.01" placeholder="0.00"
                        {...register("amount", { valueAsNumber: true })}
                        className="h-9 text-sm bg-muted/50 border-border/50 pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Method</Label>
                    <select {...register("paymentMethod")}
                      className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Remarks</Label>
                  <textarea {...register("remarks")} placeholder="Enter remarks here..." rows={2}
                    className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-emerald-500 outline-none" />
                </div>

                <button type="button"
                  className="flex items-center justify-center w-14 h-14 bg-muted/50 border border-dashed border-border rounded-xl hover:border-emerald-500 transition-colors">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1 h-10 border-border/50"
                    onClick={onClose}>Cancel</Button>
                  <Button type="submit"
                    className="flex-1 h-10 bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                    disabled={loading}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Save Payment Out
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
