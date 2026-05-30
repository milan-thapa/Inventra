"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ChevronDown, Settings, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfileStore } from "@/stores/profile-store";
import { createSalesReturn } from "@/lib/actions/sales-returns";
import { getItems } from "@/lib/actions/inventory";
import { getParties } from "@/lib/actions/party";
import { getSales } from "@/lib/actions/sales";
import { toast } from "sonner";

interface LineItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function CreateSalesReturnPage() {
  const router = useRouter();
  const { activeProfileId, getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const [partyId, setPartyId] = useState("");
  const [saleId, setSaleId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");

  // Extra charges
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"pct" | "flat">("pct");
  const [taxLabel, setTaxLabel] = useState("VAT 13%");
  const [taxPct, setTaxPct] = useState(13);
  const [extraCharges, setExtraCharges] = useState<{ label: string; amount: number }[]>([]);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemId: "", name: "", quantity: 0, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (activeProfileId) {
      getItems(activeProfileId).then((res) => res.data && setInventoryItems(res.data));
      getParties(activeProfileId, "ALL").then((res) => res.data && setParties(res.data));
      getSales(activeProfileId).then((res) => res.data && setSales(res.data));
    }
  }, [activeProfileId]);

  const calcAmount = (qty: number, rate: number) => {
    return qty * rate;
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === "itemId") {
        const sel = inventoryItems.find((i) => i.id === value);
        if (sel) {
          item.name = sel.name;
          item.rate = Number(sel.sellingPrice);
        }
      }

      item.amount = calcAmount(
        field === "quantity" ? Number(value) : item.quantity,
        field === "rate" ? Number(value) : item.rate
      );

      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), itemId: "", name: "", quantity: 0, rate: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaleChange = (saleId: string) => {
    setSaleId(saleId);
    const selectedSale = sales.find((s) => s.id === saleId);
    if (selectedSale) {
      setPartyId(selectedSale.partyId || "");
      // Load items from the sale
      const saleItems = selectedSale.items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        rate: Number(item.rate),
        amount: Number(item.amount),
      }));
      setLineItems(saleItems.length > 0 ? saleItems : [{ id: "1", itemId: "", name: "", quantity: 0, rate: 0, amount: 0 }]);
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discountAmt = discountType === "pct" ? subtotal * (discount / 100) : discount;
  const taxBase = subtotal - discountAmt;
  const taxAmount = taxBase * (taxPct / 100);
  const extraTotal = extraCharges.reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = taxBase + taxAmount + extraTotal;

  async function handleSubmit() {
    if (!activeProfileId) return toast.error("No active profile");
    const validItems = lineItems.filter((i) => i.name && i.quantity > 0 && i.rate >= 0);
    if (!validItems.length) return toast.error("Add at least one item");
    if (!reason) return toast.error("Please provide a reason for the return");

    setLoading(true);
    const res = await createSalesReturn(activeProfileId, {
      saleId: saleId || undefined,
      partyId: partyId && partyId !== "none" ? partyId : undefined,
      items: validItems,
      totalAmount: subtotal,
      refundAmount: grandTotal,
      reason,
      remarks,
      date: new Date(date),
    });
    setLoading(false);

    if ("error" in res && res.error) return toast.error(res.error);
    toast.success("Sales return created successfully");
    router.push("/sales");
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" asChild>
            <Link href="/sales">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold text-foreground">Create Sales Return</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* ── Top row: Party | Invoice No | Date ── */}
        <div className="flex items-end gap-4">
          {/* Party — takes remaining width */}
          <div className="flex-1 space-y-1 max-w-xs">
            <Label className="text-[11px] font-medium text-muted-foreground">Select Party</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="h-[34px] text-sm border-border bg-background text-muted-foreground">
                <SelectValue placeholder="Search for party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Cash Return</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice No */}
          <div className="space-y-1 w-[120px]">
            <Label className="text-[11px] font-medium text-muted-foreground">Invoice No</Label>
            <Select value={saleId} onValueChange={handleSaleChange}>
              <SelectTrigger className="h-[34px] text-sm border-border bg-background text-muted-foreground">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {sales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.invoiceNo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1 w-[160px]">
            <Label className="text-[11px] font-medium text-muted-foreground">Return Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[34px] text-sm border-border"
            />
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "50px" }} />
              <col />
              <col style={{ width: "140px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "50px" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-3">S.N.</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-3">Quantity</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-3">Rate</th>
                <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-3">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-3 py-3 text-xs text-muted-foreground font-medium">{index + 1}</td>

                  {/* Name */}
                  <td className="px-3 py-3">
                    {inventoryItems.length > 0 ? (
                      <Select value={item.itemId} onValueChange={(v) => updateLineItem(index, "itemId", v)}>
                        <SelectTrigger className="h-9 text-sm border-border bg-card shadow-sm">
                          <SelectValue placeholder="Enter Item name" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter Item name"
                        value={item.name}
                        onChange={(e) => updateLineItem(index, "name", e.target.value)}
                        className="h-9 text-sm border-gray-200 bg-white shadow-sm"
                      />
                    )}
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min="1" step="1"
                        value={item.quantity > 0 ? item.quantity : ""}
                        onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                        placeholder="0"
                        className="h-9 text-sm text-right w-20 border-border bg-card shadow-sm placeholder:text-muted-foreground"
                      />
                      <span className="text-xs text-muted-foreground font-medium">PCS</span>
                    </div>
                  </td>

                  {/* Rate */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Rs.</span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={item.rate > 0 ? item.rate : ""}
                        onChange={(e) => updateLineItem(index, "rate", Number(e.target.value))}
                        placeholder="0"
                        className="h-9 text-sm text-right flex-1 border-border bg-card shadow-sm placeholder:text-muted-foreground"
                      />
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                    Rs. {item.amount > 0 ? item.amount.toFixed(2) : ""}
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Item row + Subtotal */}
          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Billing Item
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground font-medium">Sub Total</span>
              <span className="font-semibold text-foreground min-w-[80px] text-right">
                Rs. {subtotal > 0 ? subtotal.toFixed(2) : "0.00"}
              </span>
              <div className="w-9" />
            </div>
          </div>
        </div>

        {/* ── Bottom: Notes left | Totals right ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left */}
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground block mb-1">Reason for Return *</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for return..."
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-emerald-500"
            />
            <Label className="text-[11px] font-medium text-muted-foreground block mt-3 mb-1">Notes or Remarks</Label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter note or description..."
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Right: totals */}
          <div className="space-y-0">
            {/* Discount */}
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <span className="text-sm font-medium text-foreground">Discount</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={discount > 0 ? discount : ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 h-8 text-sm text-right border-border placeholder:text-muted-foreground"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "pct" | "flat")}
                  className="h-8 text-sm border border-border rounded px-2"
                >
                  <option value="pct">%</option>
                  <option value="flat">Rs</option>
                </select>
                <span className="text-xs text-muted-foreground w-20 text-right">
                  Rs. {discountAmt > 0 ? discountAmt.toFixed(2) : "0.00"}
                </span>
                {discount > 0 && (
                  <button type="button" className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center transition-colors" onClick={() => setDiscount(0)}>
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <span className="text-sm font-medium text-foreground">Tax</span>
              <div className="flex items-center gap-2">
                <select
                  value={taxLabel}
                  onChange={(e) => {
                    setTaxLabel(e.target.value);
                    setTaxPct(e.target.value.includes("13") ? 13 : e.target.value.includes("10") ? 10 : 0);
                  }}
                  className="h-8 text-sm border border-border rounded px-2"
                >
                  <option value="VAT 13%">VAT 13%</option>
                  <option value="VAT 10%">VAT 10%</option>
                  <option value="No Tax">No Tax</option>
                </select>
                <span className="text-xs text-muted-foreground w-20 text-right">
                  Rs. {taxAmount > 0 ? taxAmount.toFixed(2) : "0.00"}
                </span>
                {taxPct > 0 && (
                  <button type="button" className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center transition-colors" onClick={() => { setTaxLabel("No Tax"); setTaxPct(0); }}>
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Extra charges */}
            {extraCharges.map((charge, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
                <Input
                  value={charge.label}
                  onChange={(e) => {
                    const n = [...extraCharges];
                    n[i].label = e.target.value;
                    setExtraCharges(n);
                  }}
                  className="h-8 text-sm border-border flex-1 mr-2 placeholder:text-muted-foreground"
                  placeholder="Charge name"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={charge.amount > 0 ? charge.amount : ""}
                    onChange={(e) => {
                      const n = [...extraCharges];
                      n[i].amount = Number(e.target.value);
                      setExtraCharges(n);
                    }}
                    placeholder="0"
                    className="w-20 h-8 text-sm text-right border-border placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center transition-colors"
                    onClick={() => setExtraCharges(extraCharges.filter((_, j) => j !== i))}
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium py-2 hover:text-emerald-700 transition-colors"
              onClick={() => setExtraCharges([...extraCharges, { label: "", amount: 0 }])}
            >
              <Plus className="w-3 h-3" /> Add More Charges
            </button>

            {/* Total Amount */}
            <div className="flex items-center justify-between py-4 border-t-2 border-border mt-2">
              <span className="text-sm font-semibold text-foreground">Total Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rs.</span>
                <div className="w-[140px] h-10 border-2 border-emerald-500 rounded-lg bg-emerald-50 flex items-center justify-end px-4 text-lg font-bold text-emerald-700">
                  {grandTotal > 0 ? grandTotal.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          className="h-[34px] px-4 text-sm border-border text-foreground"
          asChild
        >
          <Link href="/sales">Cancel</Link>
        </Button>
        <Button
          type="button"
          disabled={loading}
          className="h-[34px] px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Save Sales Return"}
        </Button>
      </div>
    </div>
  );
}
