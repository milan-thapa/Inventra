"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package, DollarSign, Hash, Box, Info, X, Ruler } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COMMON_PRIMARY_UNITS = [
  "Pieces (PCS)", "Box", "Carton", "Kilogram (kg)", "Gram (g)", 
  "Liter (L)", "Milliliter (mL)", "Pack", "Set", "Pair", "Dozen", 
  "Meter (m)", "Centimeter (cm)", "Unit"
];

const ITEM_TYPES = [
  { value: "PRODUCT", label: "Product" },
  { value: "SERVICE", label: "Service" }
];

export default function AddItemPage() {
  const router = useRouter();
  const { activeProfileId } = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Measuring Unit states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [primaryUnit, setPrimaryUnit] = useState("PCS");
  const [secondaryUnit, setSecondaryUnit] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [selectedUnitText, setSelectedUnitText] = useState("PCS");

  useEffect(() => {
    if (activeProfileId) {
      getItemCategories(activeProfileId).then(res => res.data && setCategories(res.data));
    }
  }, [activeProfileId]);

  // Handle saving the measuring unit from modal
  const handleSaveUnit = () => {
    if (!primaryUnit) {
      toast.error("Primary unit is required");
      return;
    }
    
    let displayUnit = primaryUnit;
    if (secondaryUnit && conversionRate) {
      displayUnit = `${primaryUnit} (1 ${primaryUnit} = ${conversionRate} ${secondaryUnit})`;
    }
    
    setSelectedUnitText(displayUnit);
    setShowUnitModal(false);
    toast.success("Measuring unit configured successfully");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeProfileId) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get("categoryId") as string;
    
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      purchasePrice: Number(formData.get("purchasePrice")) || 0,
      sellingPrice: Number(formData.get("sellingPrice")) || 0,
      stockQuantity: Number(formData.get("stockQuantity")) || 0,
      unit: selectedUnitText,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
    };

    const res = await createItem(activeProfileId, data);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item added successfully");
      router.push("/inventory");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900" asChild>
          <Link href="/inventory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add New Item</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Specify listing, pricing details and initial stock level</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
        
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/10">
              <Package className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Item Name <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. MacBook Pro M3" 
                className="h-11 text-sm rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-xs font-semibold text-gray-700 dark:text-gray-300">SKU / Item Code</Label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="sku" 
                  name="sku" 
                  placeholder="e.g. MAC3PRO" 
                  className="pl-10 h-11 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Item Type</Label>
              <Select name="type" defaultValue="PRODUCT">
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</Label>
              <Select name="categoryId" defaultValue="none">
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Measuring unit configured via custom Modal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unit" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Measuring Unit</Label>
                <button
                  type="button"
                  onClick={() => setShowUnitModal(true)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <Ruler className="w-3 h-3" />
                  Configure Unit
                </button>
              </div>
              <div className="relative">
                <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="unit"
                  value={selectedUnitText}
                  placeholder="Select/Configure Unit" 
                  className="pl-10 h-11 text-sm rounded-lg bg-gray-50/50 cursor-pointer"
                  onClick={() => setShowUnitModal(true)}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Description</Label>
              <Input 
                id="description" 
                name="description" 
                placeholder="Brief item description (optional)" 
                className="h-11 text-sm rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/10">
              <DollarSign className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Pricing Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Purchase Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="purchasePrice" 
                  name="purchasePrice" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00" 
                  className="pl-10 h-11 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Selling Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="sellingPrice" 
                  name="sellingPrice" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00" 
                  className="pl-10 h-11 text-sm rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/10">
              <Package className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Stock Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Opening Stock Quantity</Label>
              <Input 
                id="stockQuantity" 
                name="stockQuantity" 
                type="number" 
                min="0" 
                placeholder="e.g. 10" 
                className="h-11 text-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500">Stock Value Preview</Label>
              <div className="h-11 px-4 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg flex items-center text-xs text-gray-500">
                Opening stock value is calculated automatically on creation.
              </div>
            </div>
          </div>
        </div>

        {/* Informational banner */}
        <div className="flex items-start gap-3 p-4 bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/10 rounded-xl">
          <Info className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            All fields marked with <span className="text-destructive font-bold">*</span> are mandatory. When adding stock, make sure to specify a valid measuring unit.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" type="button" className="h-10 px-6 rounded-lg text-xs font-semibold" asChild>
            <Link href="/inventory">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 rounded-lg font-bold text-xs shadow-md shadow-emerald-600/10">
            {loading ? "Creating..." : "Save New Item"}
          </Button>
        </div>

      </form>

      {/* Select Measuring Unit Modal */}
      <Dialog open={showUnitModal} onOpenChange={setShowUnitModal}>
        <DialogContent className="max-w-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 p-0">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Select Measuring Unit
              </DialogTitle>
              <DialogDescription className="text-[11px] text-white/80 mt-0.5">
                Define the primary, secondary unit and conversion scaling rate
              </DialogDescription>
            </div>
            <button 
              onClick={() => setShowUnitModal(false)} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Primary Unit */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Primary Unit (e.g. Kilogram)</Label>
              <select
                value={primaryUnit}
                onChange={(e) => setPrimaryUnit(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
              >
                {COMMON_PRIMARY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Secondary Unit */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Secondary Unit (Optional, e.g. Gram)</Label>
              <select
                value={secondaryUnit}
                onChange={(e) => setSecondaryUnit(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">None / Not Applicable</option>
                {COMMON_PRIMARY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Conversion rate */}
            {secondaryUnit && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Conversion Rate</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="e.g. 1000"
                    className="h-10 text-xs"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
                    {secondaryUnit} per {primaryUnit}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-medium italic">
                  E.g., if Primary Unit is Kilogram and Secondary Unit is Gram, Conversion rate is 1000. (1 Kilogram = 1000 Grams)
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2.5">
            <Button 
              variant="outline" 
              onClick={() => setShowUnitModal(false)} 
              className="h-9 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUnit}
              className="h-9 text-xs text-white font-bold px-4 bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
            >
              Save Unit
            </Button>
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}
