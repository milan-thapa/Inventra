// src/components/income/add-income-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Camera, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedModal } from "@/components/shared/animated-modal";
import { useToast } from "@/hooks/use-toast";
import { createIncome, getIncomeCategories } from "@/lib/actions/expense";
import { useProfileStore } from "@/stores/profile-store";
import { createIncomeSchema, type CreateIncomeInput } from "@/lib/validations/expense";

interface Category { id: string; name: string }

export function AddIncomeModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveNew, setSaveNew] = useState(false);
  const [items, setItems] = useState<{ name: string; amount: string }[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateIncomeInput>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: { paymentMethod: "CASH", date: new Date(), items: [] },
  });

  useEffect(() => {
    if (open && activeProfile?.id) {
      getIncomeCategories(activeProfile.id).then((res) => {
        if (res.data) setCategories(res.data);
      });
    }
  }, [open, activeProfile?.id]);

  const onSubmit = async (data: CreateIncomeInput) => {
    if (!activeProfile?.id) return;
    setLoading(true);

    const res = await createIncome(activeProfile.id, {
      ...data,
      items: items
        .filter((i) => i.name && i.amount)
        .map((i) => ({ name: i.name, amount: parseFloat(i.amount) })),
    });

    setLoading(false);

    if ("error" in res && res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Income Added Successfully" });
      if (saveNew) {
        reset({ paymentMethod: "CASH", date: new Date(), items: [] });
        setItems([]);
      } else {
        onClose();
        onSuccess?.();
      }
    }
  };

  const addItem = () => setItems([...items, { name: "", amount: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: "name" | "amount", value: string) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  return (
    <AnimatedModal open={open} onClose={onClose} title="Add Income">
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Row: Income No + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground">Income No.</Label>
                      <button type="button" className="text-xs text-emerald-500">Manual</button>
                    </div>
                    <Input placeholder="Auto" className="h-9 text-sm bg-muted/50 border-border/50" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                        {...register("date", { valueAsDate: true })}
                        className="h-9 text-sm bg-muted/50 border-border/50 pr-8"
                      />
                      <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Income Category</Label>
                  <select
                    {...register("categoryId")}
                    className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
                  >
                    <option value="">Search for category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Line items */}
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="h-9 text-sm bg-muted/50 border-border/50"
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(i, "amount", e.target.value)}
                      className="h-9 text-sm bg-muted/50 border-border/50 w-24"
                    />
                    <button type="button" onClick={() => removeItem(i)} className="p-2 hover:bg-destructive/10 rounded text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button type="button" onClick={addItem}
                  className="flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Income Item
                </button>

                {/* Amount + Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Total Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                      <Input
                        type="number" step="0.01" placeholder="0.00"
                        {...register("totalAmount", { valueAsNumber: true })}
                        className="h-9 text-sm bg-muted/50 border-border/50 pl-10"
                      />
                    </div>
                    {errors.totalAmount && <p className="text-xs text-destructive mt-1">{errors.totalAmount.message}</p>}
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

                {/* Bill Image */}
                <button type="button"
                  className="flex items-center justify-center w-14 h-14 bg-muted/50 border border-dashed border-border rounded-xl hover:border-emerald-500 transition-colors">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline"
                    className="flex-1 h-10 border-border/50"
                    onClick={() => { setSaveNew(true); handleSubmit(onSubmit)(); }}
                    disabled={loading}>
                    Save &amp; New
                  </Button>
                  <Button type="submit"
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => setSaveNew(false)} disabled={loading}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Save Income
                  </Button>
                </div>
              </form>
    </AnimatedModal>
  );
}
