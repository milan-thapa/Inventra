"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, X, ChevronRight,
  ToggleLeft, ToggleRight, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileStore } from "@/stores/profile-store";
import { createItem, getItemCategories } from "@/lib/actions/inventory";
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
import { cn } from "@/lib/utils";

// ─── Common units ─────────────────────────────────────────────────────────────
const UNITS = [
  "PCS", "Box", "Carton", "Kilogram (kg)", "Gram (g)",
  "Liter (L)", "Milliliter (mL)", "Pack", "Set", "Pair",
  "Dozen", "Meter (m)", "Centimeter (cm)", "Unit",
];

// ─── Measuring Unit Modal ─────────────────────────────────────────────────────
function MeasuringUnitModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (unit: string) => void;
}) {
  const [primary, setPrimary] = useState("PCS");
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
      <DialogContent className="max-w-sm p-0 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
            Select Measuring Unit
          </DialogTitle>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Primary */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Primary Unit
            </Label>
            <select
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">e.g. Kilogram</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Secondary */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Secondary Unit
            </Label>
            <select
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">e.g. Gram</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Conversion Rate */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Conversion Rate
            </Label>
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

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
          <Button
            onClick={handleSave}
            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddItemPage() {
  const router = useRouter();
  const { activeProfileId } = useProfileStore();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stock" | "others">("stock");

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [itemType, setItemType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [openingStock, setOpeningStock] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockQty, setLowStockQty] = useState("10");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");

  const [showUnitModal, setShowUnitModal] = useState(false);

  useEffect(() => {
    if (activeProfileId) {
      getItemCategories(activeProfileId).then(
        (r) => r.data && setCategories(r.data)
      );
    }
  }, [activeProfileId]);

  const handleAddItem = async (andNew = false) => {
    if (!activeProfileId || !name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setLoading(true);
    const res = await createItem(activeProfileId, {
      name: name.trim(),
      sku: sku || undefined,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(salesPrice) || 0,
      stockQuantity: parseInt(openingStock) || 0,
      unit,
      type: itemType,
      description: description || undefined,
      categoryId: categoryId !== "none" ? categoryId : undefined,
      reorderPoint: lowStockAlert ? parseInt(lowStockQty) || 10 : undefined,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item added successfully");
      if (andNew) {
        // Reset form
        setName(""); setSku(""); setOpeningStock("");
        setSalesPrice(""); setPurchasePrice("");
        setCategoryId("none"); setItemType("PRODUCT");
      } else {
        router.push("/inventory");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Add New Item</h1>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Settings className="w-4.5 h-4.5 text-gray-500" />
        </button>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Item Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Item Name
          </Label>
          <Input
            placeholder="e.g. MacBook"
            className="h-11 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category + Item Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Item Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-11 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Item Type
            </Label>
            <div className="flex items-center gap-2 h-11">
              {(["PRODUCT", "SERVICE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setItemType(t)}
                  className={cn(
                    "h-9 px-4 rounded-lg text-xs font-semibold border transition-all",
                    itemType === t
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300"
                  )}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Stock Details / Others */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
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
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {activeTab === "stock" ? (
              <>
                {/* Opening Stock + Measuring Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Opening Stock
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="pr-14 h-10 text-sm"
                        value={openingStock}
                        onChange={(e) => setOpeningStock(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        {unit.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Measuring Unit
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowUnitModal(true)}
                      className="w-full h-10 flex items-center justify-between px-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:border-emerald-400 transition-colors group"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {unit}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Sales Price + Purchase Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Sales Price
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pr-16 h-10 text-sm"
                        value={salesPrice}
                        onChange={(e) => setSalesPrice(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        /{unit.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Purchase Price
                    </Label>
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
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
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
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Low Stock Alert
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLowStockAlert(!lowStockAlert)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        lowStockAlert ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                          lowStockAlert && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>

                  {lowStockAlert && (
                    <div className="mt-3 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Low Stock Quantity
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          placeholder="10"
                          className="pr-14 h-10 text-sm bg-white dark:bg-gray-900"
                          value={lowStockQty}
                          onChange={(e) => setLowStockQty(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                          {unit.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* SKU */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    SKU / Item Code
                  </Label>
                  <Input
                    placeholder="e.g. MAC3PRO"
                    className="h-10 text-sm"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Description
                  </Label>
                  <textarea
                    placeholder="Enter item description..."
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          <Button
            variant="outline"
            className="h-10 px-6 text-sm"
            onClick={() => handleAddItem(true)}
            disabled={loading}
          >
            Save &amp; New
          </Button>
          <Button
            className="h-10 px-6 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={() => handleAddItem(false)}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </div>

      {/* Measuring Unit Modal */}
      <MeasuringUnitModal
        open={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSave={(u) => setUnit(u)}
      />
    </div>
  );
}