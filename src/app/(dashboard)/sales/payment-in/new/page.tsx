"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, DollarSign, Save, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfileStore } from "@/stores/profile-store";
import { getParties } from "@/lib/actions/party";
import { addPaymentIn } from "@/lib/actions/party";
import { toast } from "sonner";
import Link from "next/link";

export default function NewPaymentInPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);

  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    partyId: "",
    amount: "",
    paymentMethod: "CASH" as "CASH" | "BANK",
    remarks: "",
    date: new Date().toISOString().split('T')[0],
  });

  const loadParties = useCallback(async () => {
    try {
      const res = await getParties(activeProfileId!, "ALL");
      if (res.data) {
        setParties(res.data);
        // Auto-select first party if available
        if (res.data.length > 0 && !formData.partyId) {
          setFormData({ ...formData, partyId: res.data[0].id });
        }
      } else if (res.error) {
        console.error("Error loading parties:", res.error);
        toast.error(res.error);
      }
    } catch (error) {
      console.error("Failed to load parties:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, formData]);

  useEffect(() => {
    if (activeProfileId) {
      loadParties();
    }
  }, [activeProfileId, loadParties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.partyId) {
      toast.error("Please select a customer");
      setSubmitting(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      setSubmitting(false);
      return;
    }

    try {
      const res = await addPaymentIn(activeProfileId!, {
        partyId: formData.partyId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        remarks: formData.remarks,
        date: new Date(formData.date),
        receiptNumber: 0, // Will be auto-generated
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment recorded successfully");
        router.push("/sales");
      }
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Payment In</h1>
          <p className="text-muted-foreground mt-1">Record customer payment</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Customer</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party">Select Customer *</Label>
              <Select
                value={formData.partyId}
                onValueChange={(value) => setFormData({ ...formData, partyId: value })}
                required
              >
                <SelectTrigger id="party" className="h-11">
                  <SelectValue placeholder={loading ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {parties.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No customers found</p>
                      <Button variant="emerald" size="sm" asChild>
                        <Link href="/parties">
                          <Plus className="w-4 h-4 mr-2" /> Create Customer
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!formData.partyId && (
                <p className="text-xs text-destructive">Please select a customer</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Payment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="h-11 pl-10"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "CASH" | "BANK" })}
                >
                  <SelectTrigger id="paymentMethod" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  className="h-11 pl-10"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add any notes about this payment..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="emerald"
              disabled={submitting || !formData.partyId || !formData.amount || parseFloat(formData.amount) <= 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Saving..." : "Save Payment"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/sales">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
