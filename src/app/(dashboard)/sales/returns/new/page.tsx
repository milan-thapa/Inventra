"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, DollarSign, Save, Plus, Trash2, Package, FileText } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfileStore } from "@/stores/profile-store";
import { getParties } from "@/lib/actions/party";
import { getSales } from "@/lib/actions/sales";
import { getItems } from "@/lib/actions/inventory";
import { createSalesReturn } from "@/lib/actions/sales-returns";
import { toast } from "sonner";
import Link from "next/link";

interface LineItem {
  itemId?: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function NewSalesReturnPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);

  const [parties, setParties] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    saleId: "",
    partyId: "",
    items: [] as LineItem[],
    refundAmount: 0,
    reason: "",
    remarks: "",
    date: new Date().toISOString().split('T')[0],
  });

  const loadData = useCallback(async () => {
    const [partiesRes, salesRes, itemsRes] = await Promise.all([
      getParties(activeProfileId!, "ALL"),
      getSales(activeProfileId!),
      getItems(activeProfileId!),
    ]);
    if (partiesRes.data) {
      setParties(partiesRes.data);
      // Auto-select first party if available
      if (partiesRes.data.length > 0 && !formData.partyId) {
        setFormData({ ...formData, partyId: partiesRes.data[0].id });
      }
    }
    if (salesRes.data) setSales(salesRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    setLoading(false);
  }, [activeProfileId, formData]);

  useEffect(() => {
    if (activeProfileId) {
      loadData();
    }
  }, [activeProfileId, loadData]);

  const addItem = (item: any) => {
    const newItem: LineItem = {
      itemId: item.id,
      name: item.name,
      quantity: 1,
      rate: Number(item.sellingPrice),
      amount: Number(item.sellingPrice),
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);

  const handleSaleChange = (saleId: string) => {
    const selectedSale = sales.find(s => s.id === saleId);
    setFormData({
      ...formData,
      saleId,
      partyId: selectedSale?.partyId || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      setSubmitting(false);
      return;
    }

    if (!formData.reason) {
      toast.error("Please provide a reason for the return");
      setSubmitting(false);
      return;
    }

    try {
      const res = await createSalesReturn(activeProfileId!, {
        saleId: formData.saleId || undefined,
        partyId: formData.partyId || undefined,
        items: formData.items,
        totalAmount,
        refundAmount: formData.refundAmount || totalAmount,
        reason: formData.reason,
        remarks: formData.remarks,
        date: new Date(formData.date),
      });

      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Sales return created successfully");
        router.push("/sales");
      }
    } catch (error) {
      toast.error("Failed to create sales return");
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
          <h1 className="text-3xl font-bold text-foreground">Add Sales Return</h1>
          <p className="text-muted-foreground mt-1">Record product return and refund</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Selection */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Original Sale</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale">Select Sale (Optional)</Label>
              <Select
                value={formData.saleId}
                onValueChange={handleSaleChange}
                disabled={loading}
              >
                <SelectTrigger id="sale" className="h-11">
                  <SelectValue placeholder="Select original sale (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {sales.map((sale) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      #{sale.invoiceNo} - {sale.party?.name || "Cash Sale"} - {formatCurrency(sale.grandTotal, profile?.currency, profile?.currencyPos as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Customer</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party">Select Customer</Label>
              <Select
                value={formData.partyId}
                onValueChange={(value) => setFormData({ ...formData, partyId: value })}
                disabled={loading}
              >
                <SelectTrigger id="party" className="h-11">
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Returned Items</h3>
              </div>
              <Select onValueChange={(value) => addItem(items.find(i => i.id === value))}>
                <SelectTrigger className="w-64 h-9">
                  <SelectValue placeholder="Add item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {formatCurrency(Number(item.sellingPrice), profile?.currency, profile?.currencyPos as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added. Click &quot;Add item&quot; to add products to the return.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.name}</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      className="w-24 h-9"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-32 h-9"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                    <div className="w-32 text-right font-semibold">
                      {formatCurrency(item.amount, profile?.currency, profile?.currencyPos as any)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refund Details */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Refund Details</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Return Amount</span>
                <span className="font-medium">{formatCurrency(totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <div className="relative">
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={totalAmount.toString()}
                    className="h-11 pl-10"
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) || 0 })}
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Return Reason */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Return Reason</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Return *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why the customer is returning these items..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Additional Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Date */}
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Return Date</h3>
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
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              disabled={submitting || formData.items.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Creating..." : "Create Return"}
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
