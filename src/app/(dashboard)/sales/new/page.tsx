"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
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
    if (!activeProfileId) return;
    
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
      router.push("/sales");
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Sales Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="party">Customer / Party (Optional)</Label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger>
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
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4">Items</h2>
          
          <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
            <div className="col-span-4">ITEM</div>
            <div className="col-span-2 text-right">QTY</div>
            <div className="col-span-2 text-right">RATE</div>
            <div className="col-span-3 text-right">AMOUNT</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-background p-3 md:p-2 rounded-lg border border-border/50 md:border-none">
                <div className="md:col-span-4 space-y-1">
                  <Label className="md:hidden text-xs text-muted-foreground">Item</Label>
                  {items.length > 0 ? (
                     <Select value={item.itemId} onValueChange={val => updateLineItem(index, "itemId", val)}>
                       <SelectTrigger>
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
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:contents">
                    <div className="md:col-span-2 space-y-1 text-right">
                    <Label className="md:hidden text-xs text-muted-foreground text-left">Quantity</Label>
                    <Input 
                        type="number" min="1" required
                        className="text-right"
                        value={item.quantity || ""} 
                        onChange={e => updateLineItem(index, "quantity", Number(e.target.value))} 
                    />
                    </div>
                    
                    <div className="md:col-span-2 space-y-1 text-right">
                    <Label className="md:hidden text-xs text-muted-foreground text-left">Rate</Label>
                    <Input 
                        type="number" min="0" step="0.01" required
                        className="text-right"
                        value={item.rate || ""} 
                        onChange={e => updateLineItem(index, "rate", Number(e.target.value))} 
                    />
                    </div>
                </div>
                
                <div className="md:col-span-3 space-y-1 text-right">
                  <Label className="md:hidden text-xs text-muted-foreground text-left">Amount</Label>
                  <div className="h-10 px-3 py-2 flex items-center justify-end bg-muted/30 rounded-md font-medium">
                    {item.amount.toFixed(2)}
                  </div>
                </div>
                
                <div className="md:col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button type="button" variant="outline" onClick={addLineItem} className="mt-2 text-emerald-600 border-emerald-600 hover:bg-emerald-50">
            <Plus className="w-4 h-4 mr-2" /> Add Row
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4 h-fit">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Notes</Label>
              <Input id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes..." />
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Discount (Rs.)</span>
                <Input 
                  type="number" className="w-32 text-right h-8" min="0" step="0.01"
                  value={discount || ""} onChange={e => setDiscount(Number(e.target.value))} 
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Tax (%)</span>
                <Input 
                  type="number" className="w-32 text-right h-8" min="0" max="100" step="0.1"
                  value={tax || ""} onChange={e => setTax(Number(e.target.value))} 
                />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-2xl font-bold text-emerald-600">{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-sm z-10">
          <Button variant="outline" type="button" asChild>
            <Link href="/sales">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
