"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2,
  Box, Package, PlusCircle, MinusCircle,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  ChevronDown, ArrowLeft, Filter, Settings, X,
  BarChart2, FileText, Calendar, Hash, Tag, Download, Upload,
  Barcode, Printer, Loader2
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import {
  getItems, deleteItem, updateItem,
  adjustStock, getItemCategories,
  getItemActivity, exportInventoryToCSV, importInventoryFromCSV, bulkUpdateBarcodes
} from "@/lib/actions/inventory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodePrinter } from "@/components/inventory/barcode-printer";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { INVENTORY_TOUR_STEPS } from "@/components/onboarding/interactive-tour";

// ─── Stock adjustment modal ──────────────────────────────────────────────────
function AdjustStockModal({
  item,
  type,
  onClose,
  onSuccess,
  profileId,
}: {
  item: any;
  type: "ADD" | "REDUCE";
  onClose: () => void;
  onSuccess: () => void;
  profileId: string;
}) {
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState(
    type === "ADD" ? String(item.purchasePrice) : String(item.sellingPrice)
  );
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = parseInt(qty) || 0;
  const newStock =
    type === "ADD"
      ? item.stockQuantity + parsed
      : Math.max(0, item.stockQuantity - parsed);

  const handleSubmit = async () => {
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setLoading(true);
    const res = await adjustStock(profileId, item.id, type, {
      quantity: parsed,
      price: parseFloat(price) || 0,
      remarks,
      adjustedDate: date,
    });
    setLoading(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        type === "ADD" ? "Stock added successfully" : "Stock reduced successfully"
      );
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-xl p-0 overflow-hidden border border-border">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50">
          <DialogTitle className="text-base font-bold text-foreground">
            {type === "ADD" ? "Add Stock" : "Reduce Stock"}
          </DialogTitle>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Quantity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Quantity To {type === "ADD" ? "Add" : "Reduce"}
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                placeholder="0"
                className="pr-14 h-10 text-sm"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                {item.unit || "PCS"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current Stock:{" "}
              <span className="font-semibold text-foreground">
                {item.stockQuantity} {item.unit || "PCS"}
              </span>
              {parsed > 0 && (
                <>
                  {" "}→ New Stock:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      type === "ADD"
                        ? "text-muted-foreground"
                        : newStock === 0
                        ? "text-red-500"
                        : "text-amber-600"
                    )}
                  >
                    {newStock} {item.unit || "PCS"}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Price + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                {type === "ADD" ? "Purchase Price" : "Sales Price"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-10 text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Adjusted Date
              </Label>
              <Input
                type="date"
                className="h-10 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Remarks
            </Label>
            <Input
              placeholder="Enter remarks here..."
              className="h-10 text-sm"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/50 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "h-9 text-xs font-semibold text-white",
              type === "ADD"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-500 hover:bg-red-600"
            )}
          >
            {loading
              ? "Processing..."
              : type === "ADD"
              ? "Add Stock"
              : "Reduce Stock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Detail Panel ────────────────────────────────────────────────────────
function ItemDetailPanel({
  item,
  profileId,
  profile,
  onStockAdjust,
  onManageItem,
  onDelete,
}: {
  item: any;
  profileId: string;
  profile: any;
  onStockAdjust: (type: "ADD" | "REDUCE") => void;
  onManageItem: () => void;
  onDelete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"activity" | "details">("activity");
  const [activity, setActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activitySort, setActivitySort] = useState<"latest" | "oldest">("latest");
  const [activityFilter, setActivityFilter] = useState("All Activity");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (item && profileId) {
      setLoadingActivity(true);
      getItemActivity(profileId, item.id).then((res) => {
        if (res.data) setActivity(res.data);
        setLoadingActivity(false);
      });
    }
  }, [item, profileId]);

  const initials = item.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const stockValue = item.stockQuantity * item.purchasePrice;

  const FILTER_OPTIONS = [
    "All Activity", "Sales", "Purchase", "Added Stock",
    "Reduced Stock", "Sales Return", "Purchase Return", "Quotation"
  ];

  const filteredActivity = activity
    .filter((a) => {
      if (activityFilter === "All Activity") return true;
      return a.type?.toLowerCase().replace("_", " ") === activityFilter.toLowerCase();
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return activitySort === "latest" ? -diff : diff;
    });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Item Header */}
      <div className="px-6 py-4 border-b border-border flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {item.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {item.category?.name || "General"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground border border-border"
            onClick={onManageItem}
          >
            <Settings className="w-3.5 h-3.5" />
            Manage Item
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-900/20"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-3 border-b border-border/50 grid grid-cols-4 gap-4">
        {[
          { label: "Stock Quantity", value: `${item.stockQuantity} ${item.unit || "PCS"}` },
          { label: "Sales Price", value: formatCurrency(item.sellingPrice, profile?.currency, profile?.currencyPos) },
          { label: "Purchase Price", value: formatCurrency(item.purchasePrice, profile?.currency, profile?.currencyPos) },
          { label: "Stock Value", value: formatCurrency(stockValue, profile?.currency, profile?.currencyPos) },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
              {stat.label}
            </p>
            <p className="text-sm font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 flex items-center gap-6 border-b border-border">
        {[
          { id: "activity", label: "Item Activity" },
          { id: "details", label: "Item Details" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-foreground text-muted-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Adjust Stock button */}
        <div className="ml-auto flex items-center gap-2 py-2">
          {activeTab === "activity" && (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1 border border-border"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                Sort
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sort By</p>
                  {["latest", "oldest"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setActivitySort(s as any); setShowSortMenu(false); }}
                      className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted capitalize flex items-center justify-between",
                        activitySort === s && "text-muted-foreground font-semibold")}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {activitySort === s && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  ))}
                  <div className="border-t border-border/50 my-1" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Filter By</p>
                  {FILTER_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActivityFilter(f); setShowSortMenu(false); }}
                      className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center justify-between",
                        activityFilter === f && "text-muted-foreground font-semibold")}
                    >
                      {f}
                      {activityFilter === f && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                Adjust Stock
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onStockAdjust("ADD")}>
                <PlusCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                Add Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStockAdjust("REDUCE")}>
                <MinusCircle className="w-4 h-4 mr-2 text-red-500" />
                Reduce Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "activity" ? (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">
              Item Activity ({filteredActivity.length})
            </h3>

            {loadingActivity ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredActivity.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No activity found
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {["Type", "Date", "Change", "Quantity", "Remarks"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredActivity.map((act) => {
                      const isAdd = act.type === "ADD";
                      return (
                        <tr key={act.id} className="hover:bg-muted">
                          <td className="px-4 py-3 text-xs font-medium text-foreground">
                            {isAdd ? "Add Stock" : "Reduce Stock"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(act.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric"
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                isAdd ? "text-emerald-600" : "text-red-500"
                              )}
                            >
                              {isAdd ? "+" : "-"}
                              {act.quantity} {item.unit || "PCS"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            >
                              {act.newQty} {item.unit || "PCS"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                            {act.reason || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Item Type", value: item.type || "Product" },
              { label: "SKU", value: item.sku || "—" },
              { label: "Low Stock", value: item.reorderPoint ? `${item.reorderPoint} ${item.unit || "PCS"}` : "—" },
              { label: "Primary Unit", value: item.unit || "PCS" },
              { label: "Description", value: item.description || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{label}:</span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "REDUCE">("ADD");

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterItemType, setFilterItemType] = useState("allItems");
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedForBarcode, setSelectedForBarcode] = useState<Set<string>>(new Set());
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);
  const [barcodeResults, setBarcodeResults] = useState<any>(null);
  const [showBarcodePrinter, setShowBarcodePrinter] = useState(false);

  const loadItems = useCallback(async () => {
    if (!activeProfileId) return;
    setLoading(true);
    const res = await getItems(activeProfileId);
    if (res.data) {
      setItems(res.data);
      if (res.data.length > 0) setSelectedItem(res.data[0]);
    }
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadItems();
      getItemCategories(activeProfileId).then(
        (r) => r.data && setCategories(r.data)
      );
    }
  }, [activeProfileId, loadItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q));

      const rp = item.reorderPoint || 10;
      const matchStock =
        filterStock === "all" ||
        (filterStock === "in-stock" && item.stockQuantity > rp) ||
        (filterStock === "low-stock" && item.stockQuantity > 0 && item.stockQuantity <= rp) ||
        (filterStock === "out-of-stock" && item.stockQuantity === 0);

      const matchCat =
        filterCategory === "all" || item.category?.id === filterCategory;

      const matchType =
        filterItemType === "allItems" ||
        (filterItemType === "product" && item.type === "PRODUCT") ||
        (filterItemType === "service" && item.type === "SERVICE");

      return matchSearch && matchStock && matchCat && matchType;
    });
  }, [items, search, filterStock, filterCategory, filterItemType]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    const res = await deleteItem(activeProfileId, deleteId);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item deleted");
      const updated = items.filter((i) => i.id !== deleteId);
      setItems(updated);
      if (selectedItem?.id === deleteId) setSelectedItem(updated[0] ?? null);
    }
    setDeleteId(null);
  };

  const handleExport = async () => {
    if (!activeProfileId) return;
    const res = await exportInventoryToCSV(activeProfileId);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.data) {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Inventory exported successfully");
    }
  };

  const handleBulkGenerateBarcodes = async () => {
    if (!activeProfileId || selectedForBarcode.size === 0) {
      toast.error("Please select at least one item");
      return;
    }
    
    setGeneratingBarcodes(true);
    const itemIds = Array.from(selectedForBarcode);
    const res = await bulkUpdateBarcodes(activeProfileId, itemIds);
    setGeneratingBarcodes(false);
    
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success(`Generated barcodes for ${res.data.success} items`);
      setBarcodeResults(res.data);
      loadItems(); // Refresh items to show new barcodes
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedForBarcode(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    if (selectedForBarcode.size === filteredItems.length) {
      setSelectedForBarcode(new Set());
    } else {
      setSelectedForBarcode(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleImport = async () => {
    if (!activeProfileId || !importFile) return;
    setImporting(true);
    const text = await importFile.text();
    const res = await importInventoryFromCSV(activeProfileId, text);
    setImporting(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if (res.data) {
      setImportResults(res.data);
      toast.success(`Imported ${res.data.success} items successfully`);
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} items failed to import`);
      }
      loadItems();
    }
  };

  // ── Empty state ──
  if (!loading && items.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 mx-auto">
            <svg viewBox="0 0 96 96" fill="none" className="w-full h-full opacity-50">
              <rect x="20" y="30" width="56" height="48" rx="4" stroke="#9ca3af" strokeWidth="2" fill="#f3f4f6" />
              <path d="M36 30V22a12 12 0 0 1 24 0v8" stroke="#9ca3af" strokeWidth="2" />
              <circle cx="48" cy="54" r="8" fill="#d1fae5" />
              <path d="M44 54l3 3 5-5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Let&apos;s add your First Item
          </h2>
          <p className="text-sm text-muted-foreground">
            Click on the add new item button and start managing your items
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              asChild
            >
              <Link href="/inventory/new">
                <Plus className="w-4 h-4" />
                Add New Item
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TourTrigger 
        tourKey="inventra-inventory-tour-completed" 
        steps={INVENTORY_TOUR_STEPS} 
        title="Learn how to manage your Inventory!" 
      />
      <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row bg-background overflow-hidden">
        {/* ── Left Panel: Item List ── */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-border flex flex-col lg:h-full h-auto max-h-[50vh] lg:max-h-none">
        {/* List Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Items ({filteredItems.length})
          </button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            asChild
            data-tour="add-item"
          >
            <Link href="/inventory/new">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Link>
          </Button>
        </div>

        {/* Reports Button */}
        <div className="px-4 py-2 border-b border-border/50">
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-2 justify-start"
            asChild
          >
            <Link href="/reports/inventory">
              <BarChart2 className="w-3.5 h-3.5" />
              Inventory Reports
            </Link>
          </Button>
        </div>

        {/* Settings Button */}
        <div className="px-4 py-2 border-b border-border/50">
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-2 justify-start"
            asChild
          >
            <Link href="/settings/feature-settings/inventory">
              <Settings className="w-3.5 h-3.5" />
              Inventory Settings
            </Link>
          </Button>
        </div>

        {/* Import/Export Button */}
        <div className="px-4 py-2 border-b border-border/50 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-9 text-xs gap-2 justify-center"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-9 text-xs gap-2 justify-center"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </Button>
        </div>

        {/* Generate Barcodes Button */}
        <div className="px-4 py-2 border-b border-border/50">
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-2 justify-start"
            onClick={() => setShowBarcodeModal(true)}
          >
            <Barcode className="w-3.5 h-3.5" />
            Generate Barcodes
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 h-8 text-xs bg-muted border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-3 py-2 flex items-center gap-1.5 border-b border-border/50" data-tour="stock-filter">
          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-7 text-[10px] px-1.5 border border-border rounded-md bg-card text-foreground font-medium flex-shrink-0"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Status */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="h-7 text-[10px] px-1.5 border border-border rounded-md bg-card text-foreground font-medium flex-shrink-0"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          <select
            value={filterItemType}
            onChange={(e) => setFilterItemType(e.target.value)}
            className="h-7 text-[10px] px-1.5 border border-border rounded-md bg-card text-foreground font-medium flex-shrink-0"
          >
            <option value="allItems">All Items</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
          </select>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto" data-tour="item-cards">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No items match your filters
            </div>
          ) : (
            filteredItems.map((item) => {
              const rp = item.reorderPoint || 10;
              const stockStatus =
                item.stockQuantity === 0
                  ? "out"
                  : item.stockQuantity <= rp
                  ? "low"
                  : "in";
              const initials = item.name
                .split(" ")
                .slice(0, 2)
                .map((w: string) => w[0])
                .join("")
                .toUpperCase();
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/50 hover:bg-muted transition-colors",
                    isSelected && "bg-muted/20 border-l-2 border-l-foreground"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-muted-foreground flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.category?.name || "General"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[11px] font-semibold ml-auto flex-shrink-0",
                      stockStatus === "out"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : stockStatus === "low"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}
                  >
                    {stockStatus === "out"
                      ? "Out of Stock"
                      : `${item.stockQuantity} ${item.unit || "PCS"}`}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Item Detail ── */}
      <div className="flex-1 overflow-hidden">
        {selectedItem ? (
          <ItemDetailPanel
            item={selectedItem}
            profileId={activeProfileId!}
            profile={profile}
            onStockAdjust={(type) => {
              setAdjustType(type);
              setAdjustItem(selectedItem);
            }}
            onManageItem={() => {
              router.push(`/inventory/edit/${selectedItem.id}`);
            }}
            onDelete={() => setDeleteId(selectedItem.id)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select an item to view details
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          type={adjustType}
          profileId={activeProfileId!}
          onClose={() => setAdjustItem(null)}
          onSuccess={() => {
            loadItems();
          }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md rounded-xl p-0 overflow-hidden border border-border">
          <div className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-base font-bold text-foreground">
              Import Items from CSV
            </DialogTitle>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Select CSV File
              </Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>CSV format: Name, SKU, Category, Type, Stock Quantity, Unit, Purchase Price, Selling Price, Low Stock Alert, Description</p>
              <p>Only &quot;Name&quot; is required. Other fields are optional.</p>
            </div>
            {importResults && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Import Results:
                </p>
                <p className="text-xs text-emerald-600">✓ {importResults.success} items imported successfully</p>
                {importResults.failed > 0 && (
                  <p className="text-xs text-red-600">✗ {importResults.failed} items failed</p>
                )}
                {importResults.errors.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 max-h-20 overflow-y-auto">
                    {importResults.errors.map((error: string, idx: number) => (
                      <p key={idx}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-border/50 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportResults(null);
              }}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Generation Modal */}
      <Dialog open={showBarcodeModal} onOpenChange={setShowBarcodeModal}>
        <DialogContent className="max-w-2xl rounded-xl p-0 overflow-hidden border border-border max-h-[80vh] flex flex-col">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground">
              Generate Barcodes for Items
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllItems}
              className="h-8 text-xs"
            >
              {selectedForBarcode.size === filteredItems.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isSelected = selectedForBarcode.has(item.id);
                const hasBarcode = !!item.barcode;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        isSelected ? "bg-emerald-600 border-emerald-600" : "border-border"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku && `SKU: ${item.sku} • `}
                          Stock: {item.stockQuantity} {item.unit || "PCS"}
                        </p>
                      </div>
                    </div>
                    {hasBarcode && (
                      <Badge variant="secondary" className="text-xs">
                        {item.barcode}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {barcodeResults && (
            <div className="px-5 py-3 bg-muted border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Generation Complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {barcodeResults.success} barcodes generated successfully
                    {barcodeResults.failed > 0 && ` • ${barcodeResults.failed} failed`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowBarcodePrinter(true)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Barcodes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBarcodeResults(null)}
                    className="h-8 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 py-3 border-t border-border/50 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {selectedForBarcode.size} item{selectedForBarcode.size !== 1 && "s"} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBarcodeModal(false);
                  setSelectedForBarcode(new Set());
                  setBarcodeResults(null);
                }}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkGenerateBarcodes}
                disabled={selectedForBarcode.size === 0 || generatingBarcodes}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {generatingBarcodes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Barcode className="w-3.5 h-3.5 mr-1.5" />
                    Generate Barcodes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Printer Modal */}
      <BarcodePrinter
        open={showBarcodePrinter}
        onClose={() => setShowBarcodePrinter(false)}
        items={filteredItems.filter(item => item.barcode)}
        currency={profile?.currency}
        currencyPos={profile?.currencyPos}
      />
    </div>
    </>
  );
}