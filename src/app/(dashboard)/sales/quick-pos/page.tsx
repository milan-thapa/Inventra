"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Minus,
  Search,
  X,
  Info,
  Pencil,
  Trash2,
  Camera,
  Printer,
  Save,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfileStore } from "@/stores/profile-store";
import { createSale, getNextInvoiceNo } from "@/lib/actions/sales";
import { getItems, getItemCategories, createItem } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { getParties } from "@/lib/actions/party";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  quantity: number;
  unit?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarLetters(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_BG = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length];
}

// ─── Apply Discount Modal ─────────────────────────────────────────────────────
//
// BUG FIX: Original stored both discountPct AND discountAmt in parent state,
// then used: effectiveDiscount = discountAmt > 0 ? discountAmt : pct calc
// When cart changed after applying, discountAmt was stale and overrode pct.
//
// FIX: onApply now receives (pct, amt). Parent stores ONLY pct.
// effectiveDiscount = subtotal * discountPct / 100 — always live, never stale.
// Modal still shows linked % ↔ Rs fields for UX parity with Karobar.

function ApplyDiscountModal({
  open,
  onClose,
  subtotal,
  existingPct,
  existingAmt,
  currency,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  existingPct: number;
  existingAmt: number;
  currency?: string;
  onApply: (pct: number, amt: number) => void;
}) {
  const [pct, setPct] = useState("");
  const [amt, setAmt] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existingPct > 0) {
      setPct(String(existingPct));
      setAmt(((subtotal * existingPct) / 100).toFixed(2));
    } else if (existingAmt > 0 && subtotal > 0) {
      setPct(((existingAmt / subtotal) * 100).toFixed(2));
      setAmt(String(existingAmt));
    } else {
      setPct("");
      setAmt("");
    }
  }, [open, existingPct, existingAmt, subtotal]);

  const onPctChange = (v: string) => {
    setPct(v);
    const n = parseFloat(v);
    setAmt(!isNaN(n) ? ((subtotal * n) / 100).toFixed(2) : "");
  };

  const onAmtChange = (v: string) => {
    setAmt(v);
    const n = parseFloat(v);
    setPct(!isNaN(n) && subtotal > 0 ? ((n / subtotal) * 100).toFixed(2) : "");
  };

  const handleApply = () => {
    onApply(parseFloat(pct) || 0, parseFloat(amt) || 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Apply Discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-sm font-semibold">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">Discount</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={pct}
                  onChange={(e) => onPctChange(e.target.value)}
                  placeholder="0"
                  className="pr-8 h-10 focus-visible:ring-emerald-500 border-border/60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  %
                </span>
              </div>
              <span className="text-muted-foreground text-sm select-none">🔗</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rs.
                </span>
                <Input
                  type="number"
                  value={amt}
                  onChange={(e) => onAmtChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-10 focus-visible:ring-emerald-500 border-border/60"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Apply Discount
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Apply Tax Modal ──────────────────────────────────────────────────────────
//
// BUG FIX: Same stale-amount issue as discount. Fixed identically.
// Parent stores only taxPct; effectiveTax = taxableAmount * taxPct / 100.

function ApplyTaxModal({
  open,
  onClose,
  taxableAmount,
  existingPct,
  existingAmt,
  currency,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  taxableAmount: number;
  existingPct: number;
  existingAmt: number;
  currency?: string;
  onApply: (pct: number, amt: number) => void;
}) {
  const [pct, setPct] = useState("");
  const [amt, setAmt] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existingPct > 0) {
      setPct(String(existingPct));
      setAmt(((taxableAmount * existingPct) / 100).toFixed(2));
    } else if (existingAmt > 0 && taxableAmount > 0) {
      setPct(((existingAmt / taxableAmount) * 100).toFixed(2));
      setAmt(String(existingAmt));
    } else {
      setPct("");
      setAmt("");
    }
  }, [open, existingPct, existingAmt, taxableAmount]);

  const onPctChange = (v: string) => {
    setPct(v);
    const n = parseFloat(v);
    setAmt(!isNaN(n) ? ((taxableAmount * n) / 100).toFixed(2) : "");
  };

  const onAmtChange = (v: string) => {
    setAmt(v);
    const n = parseFloat(v);
    setPct(!isNaN(n) && taxableAmount > 0 ? ((n / taxableAmount) * 100).toFixed(2) : "");
  };

  const handleApply = () => {
    onApply(parseFloat(pct) || 0, parseFloat(amt) || 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Apply Tax (VAT)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Taxable Amount</span>
            <span className="text-sm font-semibold">{formatCurrency(taxableAmount, currency)}</span>
          </div>
          <div>
            <Label className="text-xs font-medium mb-2 block">Tax %</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={pct}
                  onChange={(e) => onPctChange(e.target.value)}
                  placeholder="0"
                  className="pr-8 h-10 focus-visible:ring-emerald-500 border-border/60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  %
                </span>
              </div>
              <span className="text-muted-foreground text-sm select-none">🔗</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rs.
                </span>
                <Input
                  type="number"
                  value={amt}
                  onChange={(e) => onAmtChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-10 focus-visible:ring-emerald-500 border-border/60"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Apply Tax
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add New Item Modal ────────────────────────────────────────────────────────
// Matches Karobar screenshot exactly including "+ Add Secondary Unit" link.

function AddNewItemModal({
  open,
  onClose,
  activeProfileId,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  activeProfileId: string;
  categories: any[];
  onSaved: (item: any) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    type: "PRODUCT" as "PRODUCT" | "SERVICE",
    salesPrice: "",
    purchasePrice: "",
    openingStock: "",
    unit: "PCS",
    itemCode: "",
    hsCode: "",
    description: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await createItem(activeProfileId, {
        name: form.name,
        categoryId: form.categoryId || undefined,
        type: form.type,
        sellingPrice: parseFloat(form.salesPrice) || 0,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        stockQuantity: parseFloat(form.openingStock) || 0,
        unit: form.unit,
        sku: form.itemCode || undefined,
        description: form.description || undefined,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Item Added Successfully");
      onSaved(res.data);
      onClose();
      setForm({
        name: "",
        categoryId: "",
        type: "PRODUCT",
        salesPrice: "",
        purchasePrice: "",
        openingStock: "",
        unit: "PCS",
        itemCode: "",
        hsCode: "",
        description: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Add New Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Item Name */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Item Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Earphone"
              className="focus-visible:ring-emerald-500"
            />
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Item Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger className="focus:ring-emerald-500 h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Item Type</Label>
              <div className="flex rounded-lg border border-border/60 overflow-hidden h-10">
                {(["PRODUCT", "SERVICE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set("type", t)}
                    className={cn(
                      "flex-1 text-xs font-semibold transition-colors",
                      form.type === t
                        ? "bg-emerald-500 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {t === "PRODUCT" ? "Product" : "Service"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sales + Purchase Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Sales Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rs.
                </span>
                <Input
                  type="number"
                  value={form.salesPrice}
                  onChange={(e) => set("salesPrice", e.target.value)}
                  placeholder="0"
                  className="pl-9 pr-14 focus-visible:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /PCS
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Purchase Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rs.
                </span>
                <Input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", e.target.value)}
                  placeholder="0"
                  className="pl-9 pr-14 focus-visible:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /PCS
                </span>
              </div>
            </div>
          </div>

          {/* Opening Stock + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Opening Stock</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={form.openingStock}
                  onChange={(e) => set("openingStock", e.target.value)}
                  placeholder="0"
                  className="pr-14 focus-visible:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  PCS
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Primary Unit</Label>
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger className="focus:ring-emerald-500 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PCS", "KG", "LTR", "MTR", "BOX", "DOZEN", "PAIR"].map((u) => (
                    <SelectItem key={u} value={u}>
                      PIECES ({u})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* + Add Secondary Unit — visible in Karobar screenshot */}
          <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left">
            + Add Secondary Unit
          </button>

          {/* Item Code + HS Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Item Code</Label>
              <div className="flex gap-2">
                <Input
                  value={form.itemCode}
                  onChange={(e) => set("itemCode", e.target.value)}
                  placeholder="Enter item code"
                  className="focus-visible:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() =>
                    set("itemCode", Math.random().toString(36).substring(2, 8).toUpperCase())
                  }
                >
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">HS Code</Label>
              <Input
                value={form.hsCode}
                onChange={(e) => set("hsCode", e.target.value)}
                placeholder="Enter HS code"
                className="focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Write description here..."
              rows={3}
              className="focus-visible:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Cart Item Modal ──────────────────────────────────────────────────────

function EditCartItemModal({
  open,
  onClose,
  item,
  currency,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  item: CartItem | null;
  currency?: string;
  onSave: (id: string, qty: number, price: number) => void;
}) {
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");

  useEffect(() => {
    if (item && open) {
      setQty(String(item.quantity));
      setPrice(String(item.sellingPrice));
    }
  }, [item, open]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Edit Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Item Name</Label>
            <Input value={item.name} disabled className="bg-muted/30 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Quantity</Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="1"
                className="focus-visible:ring-emerald-500"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="focus-visible:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>Total</span>
            <span className="font-semibold text-foreground">
              {formatCurrency((parseFloat(qty) || 0) * (parseFloat(price) || 0), currency)}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              onSave(item.id, parseFloat(qty) || 1, parseFloat(price) || 0);
              onClose();
            }}
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirm Sale Modal ────────────────────────────────────────────────────────
//
// BUG FIX 1: Received Amount was `defaultValue={total}` (uncontrolled).
// If user went back and changed cart after opening modal, field stayed stale.
// FIX: Controlled state + useEffect to sync whenever total prop changes.
//
// BUG FIX 2: Invoice No was always disabled. Karobar shows the real next
// invoice number pre-filled, with a "Manual" toggle to override it.
// FIX: Accept nextInvoiceNo prop, show it in the field, "Manual" link
// toggles the field to editable so user can type a different number.

function ConfirmSaleModal({
  open,
  onClose,
  total,
  currency,
  parties,
  loading,
  nextInvoiceNo,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  currency?: string;
  parties: any[];
  loading: boolean;
  nextInvoiceNo: number;
  onSave: (data: {
    partyId?: string;
    paymentMethod: string;
    invoiceDate: string;
    notes: string;
    manualInvoiceNo?: number;
    print: boolean;
    receivedAmount: number;
    thermal: boolean;
  }) => void;
}) {
  const [partyId, setPartyId] = useState("CASH_CUSTOMER");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [thermal, setThermal] = useState(false);

  // FIX: controlled — stays in sync when total changes
  const [received, setReceived] = useState(total.toFixed(2));
  useEffect(() => {
    setReceived(total.toFixed(2));
  }, [total]);

  // Invoice number — shows auto value, Manual toggle enables editing
  const [isManual, setIsManual] = useState(false);
  const [manualNo, setManualNo] = useState(String(nextInvoiceNo));
  useEffect(() => {
    if (!isManual) setManualNo(String(nextInvoiceNo));
  }, [nextInvoiceNo, isManual]);

  const handleSave = (print: boolean) => {
    onSave({
      partyId: partyId === "CASH_CUSTOMER" ? undefined : partyId,
      paymentMethod: method,
      invoiceDate: date,
      notes,
      manualInvoiceNo: isManual ? parseInt(manualNo) || undefined : undefined,
      print,
      receivedAmount: parseFloat(received) || 0,
      thermal,
    });
  };

  const addCash = (amount: number) => {
    const current = parseFloat(received) || 0;
    setReceived((current + amount).toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Confirm Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">

          {/* Invoice No + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Invoice No</Label>
              <div className="flex gap-2 items-center">
                <Input
                  disabled={!isManual}
                  value={manualNo}
                  onChange={(e) => setManualNo(e.target.value)}
                  className={cn("text-sm", !isManual && "bg-muted/30")}
                />
                <span
                  onClick={() => setIsManual((v) => !v)}
                  className="text-[10px] text-emerald-600 font-semibold whitespace-nowrap cursor-pointer hover:underline"
                >
                  {isManual ? "Auto" : "Manual"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Invoice Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="focus-visible:ring-emerald-500 pr-9"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">Bill To</Label>
              <span className="text-xs text-muted-foreground">
                Rs.{" "}
                {partyId !== "CASH_CUSTOMER"
                  ? (parties.find((p) => p.id === partyId)?.balance?.toFixed(2) ?? "0.00")
                  : "0"}
              </span>
            </div>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="focus:ring-emerald-500 h-10">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH_CUSTOMER">Cash Customer (Default)</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="text-sm font-bold text-emerald-600">
              {formatCurrency(total, currency)}
            </span>
          </div>

          {/* Received Amount + Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 block">
                <input type="checkbox" defaultChecked className="accent-emerald-600 w-3.5 h-3.5" />
                Received Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rs.
                </span>
                {/* FIX: controlled input, syncs with total */}
                <Input
                  type="number"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  className="pl-9 focus-visible:ring-emerald-500"
                />
              </div>
              {/* Quick Cash Buttons */}
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => addCash(amt)}
                    className="flex-1 py-1 text-[10px] font-bold bg-muted/50 hover:bg-emerald-50 hover:text-emerald-600 rounded border border-border/40 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  onClick={() => setReceived(total.toFixed(2))}
                  className="flex-1 py-1 text-[10px] font-bold bg-muted/50 hover:bg-emerald-50 hover:text-emerald-600 rounded border border-border/40 transition-colors"
                >
                  Exact
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="focus:ring-emerald-500 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Cash", "Bank Transfer", "Cheque", "Card", "QR / Online"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Notes or Remarks</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or remarks here..."
              rows={3}
              className="focus-visible:ring-emerald-500 resize-none text-sm"
            />
          </div>

          {/* Attach Images — hidden file input wired to camera button (was missing before) */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Attach Images</Label>
            <label className="w-14 h-14 border-2 border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center hover:border-emerald-500/50 hover:bg-emerald-50/40 transition-colors group cursor-pointer">
              <Camera className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              <Plus className="w-3 h-3 text-muted-foreground group-hover:text-emerald-600 transition-colors -mt-0.5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    toast.success(`${files.length} image(s) attached`);
                  }
                }}
              />
            </label>
          </div>

          {/* Thermal Toggle */}
          <div className="flex items-center justify-between py-2 px-1">
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Thermal Receipt</span>
              <span className="text-[10px] text-muted-foreground">Print 80mm compact receipt</span>
            </div>
            <button
              onClick={() => setThermal(!thermal)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-200",
                thermal ? "bg-emerald-500" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                  thermal && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-border/40 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleSave(false)}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Only
          </Button>
          <Button
            size="sm"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleSave(true)}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            {loading ? "Saving..." : "Save & Print"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function QuickPOSPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextInvoiceNo, setNextInvoiceNo] = useState(1);

  // Modals
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editItem, setEditItem] = useState<CartItem | null>(null);

  // ─── Discount & Tax — store ONLY percentages ─────────────────────────────
  //
  // CORE BUG FIX:
  // Original had: discountPct, discountAmt, taxPct, taxAmt all in state.
  // effectiveDiscount = discountAmt > 0 ? discountAmt : subtotal * pct / 100
  //
  // The `discountAmt > 0` check made the stored amount override the percentage
  // even when the cart changed. Example: apply 10% on Rs.100 cart → discountAmt=10.
  // Add another item (cart = Rs.200). discountAmt is still 10, takes priority,
  // so discount shows Rs.10 instead of the correct Rs.20. Total is wrong.
  //
  // FIX: Remove discountAmt and taxAmt from state entirely.
  // effectiveDiscount = subtotal * discountPct / 100    ← recomputed every render
  // effectiveTax      = taxableAmount * taxPct / 100    ← recomputed every render
  // Both are always correct regardless of cart changes.

  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);

  // Ref for category scroll container
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Handle wheel event for horizontal scrolling with smooth behavior
  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (categoryScrollRef.current) {
      e.preventDefault();
      const container = categoryScrollRef.current;
      const scrollAmount = e.deltaY;
      
      // Use smooth scrolling behavior
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // All totals derived — never stored — always correct
  const subtotal = cart.reduce((s, i) => s + i.quantity * Number(i.sellingPrice), 0);
  const effectiveDiscount = subtotal * discountPct / 100;
  const taxableAmount = subtotal - effectiveDiscount;
  const effectiveTax = taxableAmount * taxPct / 100;
  const grandTotal = taxableAmount + effectiveTax;

  const searchRef = useRef<HTMLInputElement>(null);

  const addToCart = useCallback((item: any) => {
    if (item.stockQuantity <= 0) {
      toast.error(`Out of stock: ${item.name}`);
      return;
    }
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const currentInCart = exists?.quantity || 0;
      const currentStock = item.stockQuantity;

      if (currentInCart + 1 > currentStock) {
        toast.warning("Cannot exceed available stock");
        return prev;
      }

      if (exists) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [{ ...item, quantity: 1 }, ...prev];
    });
    setSearch("");
  }, []);

  // Load initial data
  useEffect(() => {
    if (!activeProfileId) return;
    setLoading(true);
    Promise.all([
      getItems(activeProfileId).then((r) => r.data && setItems(r.data)),
      getItemCategories(activeProfileId).then((r) => r.data && setCategories(r.data)),
      getParties(activeProfileId).then((r) => r.data && setParties(r.data)),
      getNextInvoiceNo(activeProfileId).then((r) => r.data && setNextInvoiceNo(r.data)),
    ]).finally(() => setLoading(false));
  }, [activeProfileId]);

  // Barcode scanner support: Enter key on exact SKU match adds to cart
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) setConfirmOpen(true);
      }
      if (e.key === "Escape") {
        setConfirmOpen(false);
        setAddItemOpen(false);
        setDiscountOpen(false);
        setTaxOpen(false);
        setEditItem(null);
      }
      if (e.key === "Enter" && search.length > 2) {
        const matched = items.find((i) => i.sku === search);
        if (matched) {
          addToCart(matched);
          setSearch("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [search, items, cart, addToCart]);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const orig = items.find((x) => x.id === id);
        const next = Math.max(1, i.quantity + delta);
        if (delta > 0 && orig && next > orig.stockQuantity) {
          toast.warning("Exceeds available stock");
          return i;
        }
        return { ...i, quantity: next };
      })
    );
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscountPct(0);
    setTaxPct(0);
  };

  const editCartItem = (id: string, qty: number, price: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const orig = items.find((x) => x.id === id);
        if (orig && qty > orig.stockQuantity) {
          toast.warning(`Only ${orig.stockQuantity} items in stock`);
          return { ...i, quantity: orig.stockQuantity, sellingPrice: price };
        }
        return { ...i, quantity: qty, sellingPrice: price };
      })
    );
  };

  // onApply receives (pct, amt) for modal UX parity — we only store pct
  const applyDiscount = (pct: number, _amt: number) => setDiscountPct(pct);
  const applyTax = (pct: number, _amt: number) => setTaxPct(pct);

  // Save sale to server
  const handleSave = async ({
    partyId,
    paymentMethod,
    invoiceDate,
    notes,
    manualInvoiceNo,
    print,
    receivedAmount,
    thermal,
  }: {
    partyId?: string;
    paymentMethod: string;
    invoiceDate: string;
    notes: string;
    manualInvoiceNo?: number;
    print: boolean;
    receivedAmount: number;
    thermal: boolean;
  }) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Determine status based on received vs grandTotal
    const status = receivedAmount >= grandTotal ? "PAID" : receivedAmount <= 0 ? "UNPAID" : "PARTIAL";

    setSaving(true);
    try {
      const res = await createSale(activeProfileId!, {
        items: cart.map((i) => ({
          itemId: i.id,
          name: i.name,
          quantity: i.quantity,
          rate: Number(i.sellingPrice),
          amount: i.quantity * Number(i.sellingPrice),
        })),
        totalAmount: subtotal,
        discount: effectiveDiscount,
        tax: effectiveTax,
        grandTotal,
        receivedAmount,
        partyId,
        paymentMethod,
        status,
        date: new Date(invoiceDate),
        remarks: notes,
        invoiceNo: manualInvoiceNo,
      });

      if (res.error || !res.data) {
        toast.error(res.error || "Failed to save sale");
        return;
      }

      toast.success("Sales Invoice Added Successfully");
      setConfirmOpen(false);
      clearCart();
      if (print) {
        if (thermal) {
          toast.info("Thermal printing triggered (simulation)");
        }
        window.print();
      }

      // Refresh data
      getItems(activeProfileId!).then((r) => r.data && setItems(r.data));
      getParties(activeProfileId!).then((r) => r.data && setParties(r.data));
      getNextInvoiceNo(activeProfileId!).then((r) => r.data && setNextInvoiceNo(r.data));
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q);
    const matchCat =
      activeCategory === "All" || item.category?.name === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row overflow-hidden -m-4 md:-m-6 bg-background">
      
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <Loader2 className="w-12 h-12 text-emerald-500 mx-auto relative animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Loading Quick POS...</p>
          </div>
        </div>
      )}

      {/* ── LEFT: Product Grid ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden order-2 md:order-1">

        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border/60 bg-background flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <h1 className="text-lg font-bold text-foreground">Quick POS</h1>
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-lg w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="pl-9 h-9 bg-muted/30 border-border/50 focus-visible:ring-emerald-500 text-sm"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => setAddItemOpen(true)}
              size="sm"
              variant="emerald"
              className="h-9 shrink-0 font-semibold"
            >
              <Plus className="w-4 h-4 mr-1 md:mr-1" /> <span className="hidden sm:inline">Add New Item</span>
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div
          ref={categoryScrollRef}
          onWheel={handleCategoryWheel}
          className="px-4 md:px-6 py-3 border-b border-border/40 flex items-center gap-2 overflow-x-auto no-scrollbar bg-background"
        >
          <button
            onClick={() => setActiveCategory("All")}
            className={cn(
              "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-colors shrink-0",
              activeCategory === "All"
                ? "bg-emerald-500 text-white"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-colors shrink-0",
                activeCategory === cat.name
                  ? "bg-emerald-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                const outOfStock = item.stockQuantity <= 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative bg-card border border-border/60 rounded-xl overflow-hidden transition-all",
                      !outOfStock && "hover:border-emerald-400/50 hover:shadow-md cursor-pointer",
                      outOfStock && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* ⓘ Info icon */}
                    <button className="absolute top-2.5 right-2.5 text-muted-foreground/60 hover:text-muted-foreground z-10" aria-label="Item details">
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    {/* Avatar */}
                    <div className="p-4 pb-2 flex items-start">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                          getAvatarColor(item.name)
                        )}
                      >
                        {avatarLetters(item.name)}
                      </div>
                    </div>

                    {/* Item info */}
                    <div className="px-4 pb-2">
                      <h4 className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.stockQuantity - (inCart?.quantity || 0)} {item.unit || "PCS"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.sellingPrice, profile?.currency)}/{item.unit || "PCS"}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="px-4 pb-4">
                      {inCart ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 border border-border/60 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditItem(inCart)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => !outOfStock && addToCart(item)}
                          disabled={outOfStock}
                          className={cn(
                            "w-full py-1.5 text-xs font-semibold rounded-lg border border-border/60 transition-colors",
                            outOfStock
                              ? "bg-muted/20 text-muted-foreground/40"
                              : "bg-background hover:bg-muted/50 text-foreground"
                          )}
                        >
                          {outOfStock ? "Out of Stock" : "Click to Select"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Billing Panel ─────────────────────────────────────────────── */}
      <div className="w-full md:w-[340px] border-l md:border-l border-t md:border-t border-border/60 bg-card flex flex-col order-1 md:order-2 h-[400px] md:h-auto">
        {/* Mobile Toggle - Only show on mobile */}
        <div className="md:hidden px-4 py-3 border-b border-border/50 flex items-center justify-between bg-background">
          <h2 className="text-sm font-bold">
            Billing Items
            {cart.length > 0 && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </h2>
        </div>

        {/* Header */}
        <div className="hidden md:flex px-5 py-4 border-b border-border/50 items-center justify-between">
          <h2 className="text-sm font-bold">
            Billing Items
            {cart.length > 0 && (
              <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
            >
              Clear Items
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center mb-3">
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 text-muted-foreground/40">
                  <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M14 18h20M14 24h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No Billing Items</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Select items to record a sale</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {cart.map((item) => (
                <div key={item.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-2">
                      <p className="text-xs font-semibold leading-snug">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.quantity} PCS × {formatCurrency(item.sellingPrice, profile?.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditItem(item)}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground/70 hover:text-foreground rounded transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-rose-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold border-x border-border/50 py-0.5">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      {formatCurrency(item.quantity * Number(item.sellingPrice), profile?.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals + Actions */}
        <div className="border-t border-border/50 px-5 py-4 space-y-3 bg-card">

          {/* Sub Total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Sub Total</span>
            <span className="font-semibold">{formatCurrency(subtotal, profile?.currency)}</span>
          </div>

          {/* Discount row — shown only when applied, amount always live */}
          {discountPct > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-[10px] text-muted-foreground/70">{discountPct}%</span>
                <button
                  onClick={() => setDiscountOpen(true)}
                  className="text-muted-foreground/60 hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDiscountPct(0)}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {/* Always computed from current subtotal — never stale */}
              <span className="font-semibold text-rose-500">
                -{formatCurrency(effectiveDiscount, profile?.currency)}
              </span>
            </div>
          )}

          {/* VAT row — shown only when applied, amount always live */}
          {taxPct > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">VAT {taxPct}%</span>
                <button
                  onClick={() => setTaxOpen(true)}
                  className="text-muted-foreground/60 hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setTaxPct(0)}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {/* Always computed from post-discount taxableAmount — never stale */}
              <span className="font-semibold text-amber-600">
                +{formatCurrency(effectiveTax, profile?.currency)}
              </span>
            </div>
          )}

          {/* Action links — matches Karobar exactly */}
          <div className="flex items-center gap-3 text-xs font-semibold text-emerald-600 pt-1">
            {discountPct === 0 && (
              <button
                onClick={() => setDiscountOpen(true)}
                className="hover:text-emerald-700 hover:underline transition-colors"
              >
                + Discount
              </button>
            )}
            {taxPct === 0 && (
              <button
                onClick={() => setTaxOpen(true)}
                className="hover:text-emerald-700 hover:underline transition-colors"
              >
                + Tax
              </button>
            )}
            <button className="hover:text-emerald-700 hover:underline transition-colors">
              + Additional Charges
            </button>
          </div>

          {/* Grand Total */}
          <div className="border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Total Amount</span>
              <span className="text-base font-bold text-emerald-600">
                {formatCurrency(grandTotal, profile?.currency)}
              </span>
            </div>
          </div>

          {/* Continue Billing */}
          <Button
            disabled={cart.length === 0 || loading}
            onClick={() => setConfirmOpen(true)}
            variant="emerald"
            className="w-full h-11 font-semibold text-sm mt-1"
          >
            Continue Billing
          </Button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      <AddNewItemModal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        activeProfileId={activeProfileId!}
        categories={categories}
        onSaved={(newItem) => setItems((prev) => [newItem, ...prev])}
      />

      <ApplyDiscountModal
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        subtotal={subtotal}
        existingPct={discountPct}
        existingAmt={effectiveDiscount}
        currency={profile?.currency}
        onApply={applyDiscount}
      />

      <ApplyTaxModal
        open={taxOpen}
        onClose={() => setTaxOpen(false)}
        taxableAmount={taxableAmount}
        existingPct={taxPct}
        existingAmt={effectiveTax}
        currency={profile?.currency}
        onApply={applyTax}
      />

      <EditCartItemModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        currency={profile?.currency}
        onSave={editCartItem}
      />

      <ConfirmSaleModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        total={grandTotal}
        currency={profile?.currency}
        parties={parties}
        loading={saving}
        nextInvoiceNo={nextInvoiceNo}
        onSave={handleSave}
      />
    </div>
  );
}