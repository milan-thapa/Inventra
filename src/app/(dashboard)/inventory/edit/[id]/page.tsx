"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Settings, ChevronRight, AlertTriangle, X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileStore } from "@/stores/profile-store";
import { getItem, updateItem, getItemCategories } from "@/lib/actions/inventory";
import { toast } from "sonner";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const UNITS = [
  "PCS", "Box", "Carton", "Kilogram (kg)", "Gram (g)",
  "Liter (L)", "Milliliter (mL)", "Pack", "Set", "Pair",
  "Dozen", "Meter (m)", "Centimeter (cm)", "Unit",
];

function MeasuringUnitModal({
  open,
  onClose,
  onSave,
  defaultUnit,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (unit: string) => void;
  defaultUnit?: string;
}) {
  const [primary, setPrimary] = useState(defaultUnit || "PCS");
  const [secondary, setSecondary] = useState("");
  const [rate, setRate] = useState("");

  const handleSave = () => {
    if (!primary) { toast.error("Primary unit is required"); return; }
    let display = primary;
    if (secondary && rate) {
      display = `${primary} (1 ${primary} = ${rate} ${secondary})`;
    }
    onSave(display);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <DialogTitle className="text-sm font-bold text-foreground">
            Select Measuring Unit
          </DialogTitle>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Primary Unit</Label>
            <select
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">e.g. Kilogram</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Secondary Unit</Label>
            <select
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">e.g. Gram</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Conversion Rate</Label>
            <Input
              type="number"
              placeholder="e.g. 1"
              className="h-10 text-sm"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={!secondary}
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/50 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button onClick={handleSave} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const { activeProfileId } = useProfileStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stock" | "others">("stock");

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [itemType, setItemType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [unit, setUnit] = useState("PCS");
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockQty, setLowStockQty] = useState("10");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");

  const [showUnitModal, setShowUnitModal] = useState(false);

  useEffect(() => {
    if (!activeProfileId || !itemId) return;
    Promise.all([
      getItem(activeProfileId, itemId),
      getItemCategories(activeProfileId),
    ]).then(([itemRes, catRes]) => {
      if (itemRes.data) {
        const d = itemRes.data;
        setName(d.name || "");
        setCategoryId(d.categoryId || "none");
        setItemType((d.type as any) || "PRODUCT");
        setUnit(d.unit || "PCS");
        setSellingPrice(String(d.sellingPrice || ""));
        setPurchasePrice(String(d.purchasePrice || ""));
        setLowStockAlert(!!d.reorderPoint);
        setLowStockQty(String(d.reorderPoint || 10));
        setDescription(d.description || "");
        setSku(d.sku || "");
        setBarcode(d.barcode || "");
      } else {
        toast.error(itemRes.error || "Item not found");
        router.push("/inventory");
      }
      if (catRes.data) setCategories(catRes.data);
      setPageLoading(false);
    });
  }, [activeProfileId, itemId, router]);

  const handleUpdate = async () => {
    if (!activeProfileId || !itemId || !name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setSaving(true);
    const res = await updateItem(activeProfileId, itemId, {
      name: name.trim(),
      sku: sku || undefined,
      barcode: barcode || undefined,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      unit,
      type: itemType,
      description: description || undefined,
      categoryId: categoryId !== "none" ? categoryId : undefined,
      reorderPoint: lowStockAlert ? parseInt(lowStockQty) || 10 : undefined,
    });
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item updated successfully");
      router.push("/inventory");
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-6 py-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-foreground">Edit Item</h1>
        </div>
        <button className="p-2 rounded-lg hover:bg-muted">
          <Settings className="w-4.5 h-4.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Item Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Item Name</Label>
          <Input
            placeholder="e.g. MacBook"
            className="h-11 text-sm bg-card border-border"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category + Item Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Item Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-11 text-sm bg-card border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Item Type</Label>
            <div className="flex items-center gap-2 h-11">
              {(["PRODUCT", "SERVICE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setItemType(t)}
                  className={cn(
                    "h-9 px-4 rounded-lg text-xs font-semibold border transition-all",
                    itemType === t
                      ? "bg-muted-foreground text-white border-muted-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-foreground"
                  )}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: "stock", label: "Stock Details" },
              { id: "others", label: "Others" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-muted-foreground text-muted-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {activeTab === "stock" ? (
              <>
                {/* Measuring Unit */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Measuring Unit
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(true)}
                    className="w-full h-10 flex items-center justify-between px-3 border border-border rounded-lg bg-card hover:border-emerald-400 transition-colors group"
                  >
                    <span className="text-sm text-foreground truncate">{unit}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 flex-shrink-0" />
                  </button>
                </div>

                {/* Sales Price + Purchase Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Sales Price</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pr-16 h-10 text-sm"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        /{unit.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Purchase Price</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pr-16 h-10 text-sm"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        /{unit.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Low Stock Alert */}
                <div className="border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-foreground">Low Stock Alert</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLowStockAlert(!lowStockAlert)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        lowStockAlert ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                        lowStockAlert && "translate-x-5"
                      )} />
                    </button>
                  </div>
                  {lowStockAlert && (
                    <div className="mt-3 space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Low Stock Quantity</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          placeholder="10"
                          className="pr-14 h-10 text-sm bg-card"
                          value={lowStockQty}
                          onChange={(e) => setLowStockQty(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                          {unit.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">SKU / Item Code</Label>
                  <Input
                    placeholder="e.g. MAC3PRO"
                    className="h-10 text-sm"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Barcode</Label>
                  <Input
                    placeholder="e.g. 1234567890"
                    className="h-10 text-sm"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
                  <textarea
                    placeholder="Enter item description..."
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-card text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" className="h-10 px-6 text-sm" asChild>
            <Link href="/inventory">Cancel</Link>
          </Button>
          <Button
            className="h-10 px-6 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Updating..." : "Update Item"}
          </Button>
        </div>
      </div>

      <MeasuringUnitModal
        open={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSave={(u) => setUnit(u)}
        defaultUnit={unit}
      />
    </div>
  );
}