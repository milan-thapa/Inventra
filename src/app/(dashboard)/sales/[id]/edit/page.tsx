"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ScanLine, Camera, ChevronDown, Settings, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfileStore } from "@/stores/profile-store";
import { getSale, updateSale } from "@/lib/actions/sales";
import { getItems } from "@/lib/actions/inventory";
import { getParties } from "@/lib/actions/party";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/sales/barcode-scanner";

interface LineItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  rate: number;
  discountPct: number;
  amount: number;
}

export default function EditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { activeProfileId, getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const saleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [partyId, setPartyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [status, setStatus] = useState("PAID");
  const [remarks, setRemarks] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemId: "", name: "", quantity: 1, rate: 0, discountPct: 0, amount: 0 },
  ]);

  // Extra charges
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"pct" | "flat">("pct");
  const [taxLabel, setTaxLabel] = useState("VAT 13%");
  const [taxPct, setTaxPct] = useState(13);
  const [extraCharges, setExtraCharges] = useState<{ label: string; amount: number }[]>([]);

  useEffect(() => {
    if (activeProfileId) {
      getItems(activeProfileId).then((res) => res.data && setInventoryItems(res.data));
      getParties(activeProfileId, "ALL").then((res) => res.data && setParties(res.data));
      
      // Load existing sale
      getSale(activeProfileId, saleId).then((res) => {
        if (res.data) {
          const sale = res.data;
          setPartyId(sale.partyId || "");
          setInvoiceNumber(sale.invoiceNo?.toString() || "");
          setDate(new Date(sale.date).toISOString().split("T")[0]);
          setPaymentMethod(sale.paymentMethod as "CASH" | "BANK");
          setStatus(sale.status);
          setRemarks(sale.remarks || "");
          setDiscount(sale.discount || 0);
          setTax(sale.tax || 0);
          setLineItems(sale.items?.map((item: any) => ({
            id: item.id,
            itemId: item.itemId || "",
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            discountPct: 0,
            amount: item.amount,
          })) || []);
        }
        setLoading(false);
      });
    }
  }, [activeProfileId, saleId]);

  const setTax = (taxAmount: number) => {
    if (taxAmount === 0) {
      setTaxLabel("No Tax");
      setTaxPct(0);
    } else if (taxAmount > 0) {
      setTaxLabel("VAT 13%");
      setTaxPct(13);
    }
  };

  const calcAmount = (qty: number, rate: number, discPct: number) => {
    const base = qty * rate;
    return base - base * (discPct / 100);
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
        field === "rate" ? Number(value) : item.rate,
        field === "discountPct" ? Number(value) : item.discountPct
      );

      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), itemId: "", name: "", quantity: 1, rate: 0, discountPct: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleBarcodeScan = (scannedItem: any) => {
    const existing = lineItems.findIndex((i) => i.itemId === scannedItem.id);
    if (existing >= 0) {
      updateLineItem(existing, "quantity", lineItems[existing].quantity + 1);
      toast.success(`Increased quantity of ${scannedItem.name}`);
    } else {
      setLineItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          itemId: scannedItem.id,
          name: scannedItem.name,
          quantity: 1,
          rate: Number(scannedItem.sellingPrice),
          discountPct: 0,
          amount: Number(scannedItem.sellingPrice),
        },
      ]);
      toast.success(`Added ${scannedItem.name}`);
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

    setSaving(true);
    const res = await updateSale(activeProfileId, saleId, {
      partyId: partyId && partyId !== "none" ? partyId : undefined,
      items: validItems,
      totalAmount: subtotal,
      discount: discountAmt,
      tax: taxAmount,
      grandTotal,
      paymentMethod,
      status,
      remarks,
      date: new Date(date),
    });
    setSaving(false);

    if ("error" in res && res.error) toast.error(res.error);
    else {
      toast.success("Sale invoice updated successfully");
      router.push("/sales");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" asChild>
            <Link href="/sales">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold text-foreground">Edit Sales Invoice</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Top row: Party | Invoice No | Date */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-1 max-w-xs">
            <Label className="text-[11px] font-medium text-muted-foreground">Select Party</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="h-[34px] text-sm border-border bg-background text-muted-foreground">
                <SelectValue placeholder="Search for party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Cash Sale</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 w-[120px]">
            <Label className="text-[11px] font-medium text-muted-foreground">Invoice No</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-[34px] text-sm border-border"
              readOnly
            />
          </div>

          <div className="space-y-1 w-[160px]">
            <Label className="text-[11px] font-medium text-muted-foreground">Invoice Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[34px] text-sm border-border"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "42px" }} />
              <col />
              <col style={{ width: "108px" }} />
              <col style={{ width: "118px" }} />
              <col style={{ width: "128px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "36px" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-2.5">S.N.</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-2.5">Name</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-2.5">Quantity</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-2.5">Rate</th>
                <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-2.5">Discount</th>
                <th className="text-right text-[11px] font-medium text-muted-foreground py-2 px-2.5">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => {
                const discAmt = item.quantity * item.rate * (item.discountPct / 100);
                return (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="px-2.5 py-1.5 text-xs text-muted-foreground">{index + 1}</td>

                    <td className="px-2.5 py-1.5">
                      {inventoryItems.length > 0 ? (
                        <Select value={item.itemId} onValueChange={(v) => updateLineItem(index, "itemId", v)}>
                          <SelectTrigger className="h-7 text-xs border-transparent hover:border-border focus:border-emerald-500 bg-transparent shadow-none">
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
                          className="h-7 text-xs border-transparent hover:border-border focus:border-emerald-500 bg-transparent"
                        />
                      )}
                    </td>

                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min="1"
                          value={item.quantity || ""}
                          onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                          className="h-7 text-xs text-right w-12 border-transparent hover:border-border focus:border-emerald-500 bg-transparent"
                        />
                        <span className="text-[11px] text-muted-foreground">PCS</span>
                      </div>
                    </td>

                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Rs.</span>
                        <Input
                          type="number" min="0" step="0.01"
                          value={item.rate || ""}
                          onChange={(e) => updateLineItem(index, "rate", Number(e.target.value))}
                          className="h-7 text-xs text-right flex-1 border-transparent hover:border-border focus:border-emerald-500 bg-transparent"
                        />
                      </div>
                    </td>

                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min="0" max="100"
                          value={item.discountPct || ""}
                          onChange={(e) => updateLineItem(index, "discountPct", Number(e.target.value))}
                          className="h-7 text-xs text-right w-10 border-transparent hover:border-border focus:border-emerald-500 bg-transparent"
                        />
                        <span className="text-[11px] text-muted-foreground">%</span>
                        <span className="text-[11px] text-muted-foreground">Rs.</span>
                        <span className="text-[11px] text-muted-foreground min-w-[28px] text-right">
                          {discAmt > 0 ? discAmt.toFixed(0) : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-2.5 py-1.5 text-right text-xs font-medium text-foreground">
                      Rs. {item.amount > 0 ? item.amount.toFixed(0) : ""}
                    </td>

                    <td className="px-1.5 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="w-5 h-5 bg-red-100 rounded flex items-center justify-center hover:bg-red-200"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-2.5 py-2 bg-background">
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Billing Item
            </button>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium text-foreground min-w-[56px] text-right">
                Rs. {subtotal > 0 ? subtotal.toFixed(0) : ""}
              </span>
              <div className="w-9" />
            </div>
          </div>
        </div>

        {/* Bottom: Notes left | Totals right */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground block mb-1">Notes or Remarks</Label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter note or description..."
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-emerald-500"
            />
            <Label className="text-[11px] font-medium text-muted-foreground block mt-3 mb-2">Attach Images</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {attachedImages.map((img, i) => (
                <div key={i} className="relative w-[60px] h-[60px]">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-md border border-border" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                    onClick={() => setAttachedImages(prev => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <div className="w-[60px] h-[60px] border border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-border bg-muted">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="image-upload"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setAttachedImages(prev => [...prev, ev.target?.result as string]);
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </label>
              </div>
            </div>
            {activeProfile?.barcodeEnabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 text-xs border-border gap-1"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <ScanLine className="w-3.5 h-3.5" /> Scan Barcode
              </Button>
            )}
          </div>

          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <span className="text-sm text-foreground">Discount</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 h-7 text-xs text-right border-border"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "pct" | "flat")}
                  className="h-7 text-xs border border-border rounded px-1"
                >
                  <option value="pct">%</option>
                  <option value="flat">Rs</option>
                </select>
                <span className="text-[11px] text-muted-foreground w-16 text-right">
                  Rs. {discountAmt > 0 ? discountAmt.toFixed(0) : ""}
                </span>
                <button type="button" className="w-4 h-4 bg-red-100 rounded-sm flex items-center justify-center" onClick={() => setDiscount(0)}>
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-border/50">
              <span className="text-sm text-foreground">Tax</span>
              <div className="flex items-center gap-2">
                <select
                  value={taxLabel}
                  onChange={(e) => {
                    setTaxLabel(e.target.value);
                    setTaxPct(e.target.value.includes("13") ? 13 : e.target.value.includes("10") ? 10 : 0);
                  }}
                  className="h-7 text-xs border border-border rounded px-1"
                >
                  <option value="VAT 13%">VAT 13%</option>
                  <option value="VAT 10%">VAT 10%</option>
                  <option value="No Tax">No Tax</option>
                </select>
                <span className="text-[11px] text-muted-foreground w-16 text-right">
                  Rs. {taxAmount > 0 ? taxAmount.toFixed(0) : ""}
                </span>
                <button type="button" className="w-4 h-4 bg-red-100 rounded-sm flex items-center justify-center" onClick={() => { setTaxLabel("No Tax"); setTaxPct(0); }}>
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            </div>

            {extraCharges.map((charge, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50">
                <Input
                  value={charge.label}
                  onChange={(e) => {
                    const n = [...extraCharges];
                    n[i].label = e.target.value;
                    setExtraCharges(n);
                  }}
                  className="h-7 text-xs border-border flex-1 mr-2"
                  placeholder="Charge name"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={charge.amount || ""}
                    onChange={(e) => {
                      const n = [...extraCharges];
                      n[i].amount = Number(e.target.value);
                      setExtraCharges(n);
                    }}
                    className="w-16 h-7 text-xs text-right border-border"
                  />
                  <button
                    type="button"
                    className="w-4 h-4 bg-red-100 rounded-sm flex items-center justify-center"
                    onClick={() => setExtraCharges(extraCharges.filter((_, j) => j !== i))}
                  >
                    <X className="w-2.5 h-2.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium py-2.5"
              onClick={() => setExtraCharges([...extraCharges, { label: "", amount: 0 }])}
            >
              <Plus className="w-3 h-3" /> Add More Charges
            </button>

            <div className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-sm text-foreground">Total Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Rs.</span>
                <div className="w-[120px] h-8 border border-border rounded-md bg-muted flex items-center justify-end px-3 text-sm font-semibold text-foreground">
                  {grandTotal > 0 ? grandTotal.toFixed(0) : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">Payment Mode</span>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="w-[130px] h-8 text-xs border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="h-[34px] px-4 text-sm border-border text-foreground"
          onClick={() => router.push("/sales")}
        >
          Cancel
        </Button>
        <div className="flex">
          <Button
            type="button"
            disabled={saving}
            className="h-[34px] px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-none"
            onClick={handleSubmit}
          >
            {saving ? "Saving..." : "Update Sales Invoice"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="h-[34px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-none border-l border-emerald-500"
                aria-label="More options"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSubmit}>Update & New</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <BarcodeScanner
        open={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScanSuccess={handleBarcodeScan}
      />
    </div>
  );
}
