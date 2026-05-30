"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, User, Calendar, DollarSign, Package, Receipt, Percent } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfileStore } from "@/stores/profile-store";
import { createSale } from "@/lib/actions/sales";
import { getItems } from "@/lib/actions/inventory";
import { getParties } from "@/lib/actions/party";
import { toast } from "sonner";

export default function AddSalePage() {
  const router = useRouter();
  const { activeProfileId } = useProfileStore();
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  
  // Form State
  const [partyId, setPartyId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [status, setStatus] = useState("PAID");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  
  const [lineItems, setLineItems] = useState([
    { id: Date.now().toString(), itemId: "", name: "", quantity: 1, rate: 0, amount: 0 }
  ]);
  
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (activeProfileId) {
      getItems(activeProfileId).then(res => res.data && setItems(res.data));
      getParties(activeProfileId, "ALL").then(res => res.data && setParties(res.data));
    }
  }, [activeProfileId]);

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    const item = newItems[index];
    
    if (field === "itemId") {
      const selectedItem = items.find(i => i.id === value);
      item.itemId = value;
      if (selectedItem) {
        item.name = selectedItem.name;
        item.rate = Number(selectedItem.sellingPrice);
        item.amount = item.quantity * item.rate;
      }
    } else {
      (item as any)[field] = value;
      if (field === "quantity" || field === "rate") {
        item.amount = Number(item.quantity) * Number(item.rate);
      }
    }
    
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now().toString(), itemId: "", name: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal - discount) * (tax / 100);
  const grandTotal = subtotal - discount + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProfileId) {
      toast.error("No active profile found. Please select or create a profile first.");
      return;
    }
    
    // Validation
    const validItems = lineItems.filter(i => i.name && i.quantity > 0 && i.rate >= 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setLoading(true);
    const data = {
      partyId: partyId && partyId !== "none" ? partyId : undefined,
      items: validItems,
      totalAmount: subtotal,
      discount,
      tax: taxAmount,
      grandTotal,
      paymentMethod,
      status,
      remarks,
      date: new Date(date),
    };

    const res = await createSale(activeProfileId, data);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sale invoice created successfully");
      router.refresh(); // Refresh the page data
      router.push("/sales");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
          <Link href="/sales">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Sales Invoice</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to create a new sales invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Details */}
        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Invoice Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="party" className="text-base font-medium">Customer / Party</Label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a party or leave empty for cash sale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Cash Sale</SelectItem>
                  {parties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-medium">Invoice Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="pl-10 h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-base font-medium">Payment Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Items</h2>
          </div>
          
          <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2 mb-4">
            <div className="col-span-4">ITEM</div>
            <div className="col-span-2 text-right">QTY</div>
            <div className="col-span-2 text-right">RATE</div>
            <div className="col-span-3 text-right">AMOUNT</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-background p-4 md:p-3 rounded-lg border border-border/50">
                <div className="md:col-span-4 space-y-1">
                  <Label className="md:hidden text-xs text-muted-foreground">Item</Label>
                  {items.length > 0 ? (
                     <Select value={item.itemId} onValueChange={val => updateLineItem(index, "itemId", val)}>
                       <SelectTrigger className="h-11">
                         <SelectValue placeholder="Select item..." />
                       </SelectTrigger>
                       <SelectContent>
                         {items.map(i => (
                           <SelectItem key={i.id} value={i.id}>{i.name} (Stock: {i.stockQuantity})</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                  ) : (
                    <Input 
                      placeholder="Item name" 
                      value={item.name} 
                      onChange={e => updateLineItem(index, "name", e.target.value)} 
                      required 
                      className="h-11"
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:contents">
                    <div className="md:col-span-2 space-y-1 text-right">
                    <Label className="md:hidden text-xs text-muted-foreground text-left">Quantity</Label>
                    <Input 
                        type="number" min="1" required
                        className="text-right h-11"
                        value={item.quantity || ""} 
                        onChange={e => updateLineItem(index, "quantity", Number(e.target.value))} 
                    />
                    </div>
                    
                    <div className="md:col-span-2 space-y-1 text-right">
                    <Label className="md:hidden text-xs text-muted-foreground text-left">Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="number" min="0" step="0.01" required
                        className="text-right pl-10 h-11"
                        value={item.rate || ""} 
                        onChange={e => updateLineItem(index, "rate", Number(e.target.value))} 
                      />
                    </div>
                    </div>
                </div>
                
                <div className="md:col-span-3 space-y-1 text-right">
                  <Label className="md:hidden text-xs text-muted-foreground text-left">Amount</Label>
                  <div className="h-11 px-4 flex items-center justify-end bg-muted/30 rounded-lg font-semibold text-base">
                    {item.amount.toFixed(2)}
                  </div>
                </div>
                
                <div className="md:col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="text-muted-foreground hover:text-destructive h-9 w-9">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button type="button" variant="outline" onClick={addLineItem} className="mt-4 text-emerald-600 border-emerald-600 hover:bg-emerald-50 h-11">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        {/* Summary & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Payment & Notes</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-base font-medium">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-base font-medium">Remarks / Notes</Label>
                <Input id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes..." className="h-11" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Invoice Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-lg">{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Discount</span>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" className="w-32 text-right pl-10 h-10" min="0" step="0.01"
                    value={discount || ""} onChange={e => setDiscount(Number(e.target.value))} 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Tax (%)</span>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" className="w-32 text-right pl-10 h-10" min="0" max="100" step="0.1"
                    value={tax || ""} onChange={e => setTax(Number(e.target.value))} 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xl font-bold text-foreground">Grand Total</span>
                <span className="text-3xl font-bold text-emerald-600">{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-sm z-10">
          <Button variant="outline" type="button" className="h-11 px-8" asChild>
            <Link href="/sales">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 font-semibold shadow-lg shadow-emerald-500/20">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
