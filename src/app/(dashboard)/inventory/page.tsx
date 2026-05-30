"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { 
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2, 
  Box, Package, PlusCircle, MinusCircle, ArrowUpDown, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  LayoutGrid, List, SlidersHorizontal, X, ChevronDown,
  BarChart3, PieChart, Activity, Zap, Eye, EyeOff,
  Layers, GitBranch, MapPin
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { 
  getItems, deleteItem, updateItem, 
  adjustStock, getItemCategories 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function InventoryPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const [stockAdjustItem, setStockAdjustItem] = useState<any | null>(null);
  const [stockAdjustType, setStockAdjustType] = useState<"ADD" | "REDUCE">("ADD");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  
  // Modern UI state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStock, setFilterStock] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Inline editing state
  const [editingItem, setEditingItem] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Quick add state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState({
    name: "",
    sku: "",
    barcode: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
    unit: "PCS",
    categoryId: "",
    description: "",
    specifications: "",
    brand: "",
    manufacturer: "",
    supplierId: "",
    reorderPoint: "10",
    maxStock: "",
    weight: "",
    dimensions: "",
    shelfLocation: "",
    images: [] as string[]
  });
  const [adding, setAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileId', activeProfileId!);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    }

    setQuickAddItem({ ...quickAddItem, images: [...quickAddItem.images, ...uploadedUrls] });
    setUploadingImage(false);
  };

  const removeImage = (index: number) => {
    const newImages = quickAddItem.images.filter((_, i) => i !== index);
    setQuickAddItem({ ...quickAddItem, images: newImages });
  };

  // Load batches for selected item
  const loadBatches = async (itemId: string) => {
    try {
      const res = await fetch(`/api/inventory/${itemId}/batches?profileId=${activeProfileId}`);
      const data = await res.json();
      if (data.data) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  // Load locations
  const loadLocations = async () => {
    try {
      const res = await fetch(`/api/inventory/locations?profileId=${activeProfileId}`);
      const data = await res.json();
      if (data.data) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  // Load variants for selected item
  const loadVariants = async (itemId: string) => {
    try {
      const res = await fetch(`/api/inventory/${itemId}/variants?profileId=${activeProfileId}`);
      const data = await res.json();
      if (data.data) {
        setVariants(data.data);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
    }
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await getItems(activeProfileId!);
    if (res.data) {
      setItems(res.data);
      if (res.data.length > 0 && !selectedItem) {
        setSelectedItem(res.data[0]);
      }
    }
    setLoading(false);
  }, [activeProfileId, selectedItem]);

  const loadCategories = useCallback(async () => {
    const res = await getItemCategories(activeProfileId!);
    if (res.data) {
      setCategories(res.data);
    }
    
    // Load suppliers (parties with type SUPPLIER or BOTH)
    const partiesRes = await fetch(`/api/parties?profileId=${activeProfileId}`);
    if (partiesRes.ok) {
      const partiesData = await partiesRes.json();
      if (partiesData.data) {
        const supplierParties = partiesData.data.filter((p: any) => p.type === 'SUPPLIER' || p.type === 'BOTH');
        setSuppliers(supplierParties);
      }
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadItems();
      loadCategories();
    }
  }, [activeProfileId, loadItems, loadCategories]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    const res = await deleteItem(activeProfileId, deleteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item deleted successfully");
      const updatedItems = items.filter(i => i.id !== deleteId);
      setItems(updatedItems);
      if (selectedItem?.id === deleteId) {
        setSelectedItem(updatedItems.length > 0 ? updatedItems[0] : null);
      }
      setDeleteId(null);
    }
  };

  const handleStockAdjust = async () => {
    if (!activeProfileId || !stockAdjustItem) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setAdjusting(true);
    const newStock = stockAdjustType === "ADD" 
      ? stockAdjustItem.stockQuantity + qty 
      : Math.max(0, stockAdjustItem.stockQuantity - qty);

    const res = await updateItem(activeProfileId, stockAdjustItem.id, {
      stockQuantity: newStock
    });

    setAdjusting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Stock ${stockAdjustType === "ADD" ? "added" : "reduced"} successfully`);
      loadItems();
      setStockAdjustItem(null);
      setAdjustQty("");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
        (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase()));
      
      const reorderPoint = item.reorderPoint || 10;
      const matchesStock = filterStock === "all" ||
        (filterStock === "in-stock" && item.stockQuantity > reorderPoint) ||
        (filterStock === "low-stock" && item.stockQuantity > 0 && item.stockQuantity <= reorderPoint) ||
        (filterStock === "out-of-stock" && item.stockQuantity === 0);
      
      const matchesCategory = filterCategory === "all" ||
        (item.category && item.category.id === filterCategory);
      
      return matchesSearch && matchesStock && matchesCategory;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "stock") {
        comparison = a.stockQuantity - b.stockQuantity;
      } else if (sortBy === "price") {
        comparison = a.sellingPrice - b.sellingPrice;
      } else if (sortBy === "date") {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [items, search, filterStock, filterCategory, sortBy, sortOrder]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((sum, item) => sum + item.stockQuantity, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.stockQuantity * item.sellingPrice), 0);
    const lowStockItems = items.filter(item => {
      const reorderPoint = item.reorderPoint || 10;
      return item.stockQuantity > 0 && item.stockQuantity <= reorderPoint;
    }).length;
    const outOfStockItems = items.filter(item => item.stockQuantity === 0).length;
    const inStockItems = items.filter(item => {
      const reorderPoint = item.reorderPoint || 10;
      return item.stockQuantity > reorderPoint;
    }).length;
    const itemsWithImages = items.filter(item => item.images && item.images.length > 0).length;
    
    return {
      totalItems,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems,
      inStockItems,
      itemsWithImages
    };
  }, [items]);

  // Inline editing functions
  const startInlineEdit = (itemId: string, field: string, currentValue: string | number) => {
    setEditingItem({ id: itemId, field });
    setEditValue(String(currentValue));
  };

  const cancelInlineEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const saveInlineEdit = async () => {
    if (!activeProfileId || !editingItem) return;
    
    const item = items.find(i => i.id === editingItem.id);
    if (!item) return;

    let updateData: any = {};
    
    if (editingItem.field === "stock") {
      const qty = parseInt(editValue);
      if (isNaN(qty) || qty < 0) {
        toast.error("Please enter a valid stock quantity");
        return;
      }
      updateData.stockQuantity = qty;
    } else if (editingItem.field === "price") {
      const price = parseFloat(editValue);
      if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid price");
        return;
      }
      updateData.sellingPrice = price;
    }

    const res = await updateItem(activeProfileId, item.id, updateData);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item updated successfully");
      loadItems();
      cancelInlineEdit();
    }
  };

  // Quick add functionality
  const handleQuickAdd = async () => {
    if (!activeProfileId) return;
    
    if (!quickAddItem.name.trim()) {
      toast.error("Please enter item name");
      return;
    }

    const purchasePrice = parseFloat(quickAddItem.purchasePrice) || 0;
    const sellingPrice = parseFloat(quickAddItem.sellingPrice) || 0;
    const stockQuantity = parseInt(quickAddItem.stockQuantity) || 0;
    const reorderPoint = parseInt(quickAddItem.reorderPoint) || 10;
    const maxStock = quickAddItem.maxStock ? parseInt(quickAddItem.maxStock) : null;
    const weight = quickAddItem.weight ? parseFloat(quickAddItem.weight) : null;

    setAdding(true);
    
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: activeProfileId,
        name: quickAddItem.name,
        sku: quickAddItem.sku,
        barcode: quickAddItem.barcode,
        purchasePrice,
        sellingPrice,
        stockQuantity,
        unit: quickAddItem.unit,
        categoryId: quickAddItem.categoryId || null,
        description: quickAddItem.description,
        specifications: quickAddItem.specifications,
        brand: quickAddItem.brand,
        manufacturer: quickAddItem.manufacturer,
        supplierId: quickAddItem.supplierId || null,
        reorderPoint,
        maxStock,
        weight,
        dimensions: quickAddItem.dimensions,
        shelfLocation: quickAddItem.shelfLocation,
        images: quickAddItem.images
      })
    });

    const data = await res.json();
    setAdding(false);

    if (data.error) {
      toast.error(data.error);
    } else {
      toast.success("Item added successfully");
      setShowQuickAdd(false);
      setQuickAddItem({
        name: "",
        sku: "",
        barcode: "",
        purchasePrice: "",
        sellingPrice: "",
        stockQuantity: "",
        unit: "PCS",
        categoryId: "",
        description: "",
        specifications: "",
        brand: "",
        manufacturer: "",
        supplierId: "",
        reorderPoint: "10",
        maxStock: "",
        weight: "",
        dimensions: "",
        shelfLocation: "",
        images: [] as string[]
      });
      loadItems();
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Escape: Close filters and clear dialogs
      if (e.key === "Escape") {
        setShowFilters(false);
        setStockAdjustItem(null);
        setDeleteId(null);
      }
      
      // Ctrl/Cmd + N: Add new item
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        window.location.href = "/inventory/new";
      }
      
      // Arrow keys for navigation in grid view
      if (viewMode === "grid" && filteredItems.length > 0) {
        if (e.key === "ArrowRight" && selectedItem) {
          const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
          if (currentIndex < filteredItems.length - 1) {
            setSelectedItem(filteredItems[currentIndex + 1]);
          }
        } else if (e.key === "ArrowLeft" && selectedItem) {
          const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
          if (currentIndex > 0) {
            setSelectedItem(filteredItems[currentIndex - 1]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, filteredItems, viewMode]);

  if (loading && items.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            <Box className="w-16 h-16 text-blue-500 mx-auto relative" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      {/* Modern Header with KPI Cards */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your products and stock</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-gray-300 dark:border-gray-700"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {showFilters && <X className="w-4 h-4" />}
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs">Total</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalItems}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <Badge variant="secondary" className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs">In Stock</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.inStockItems}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <Badge variant="secondary" className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs">Low Stock</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.lowStockItems}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <Badge variant="secondary" className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs">Out of Stock</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.outOfStockItems}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <Badge variant="secondary" className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs">Total Stock</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.totalStock}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Units</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <Badge variant="secondary" className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs">Value</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(kpiData.totalValue, profile?.currency, profile?.currencyPos as any)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/30 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <Badge variant="secondary" className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs">Images</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpiData.itemsWithImages}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">With Images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stock">Stock Quantity</SelectItem>
                  <SelectItem value="price">Selling Price</SelectItem>
                  <SelectItem value="date">Date Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Stock Status</Label>
              <Select value={filterStock} onValueChange={(value: any) => setFilterStock(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">View Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search items by name or SKU..."
              className="pl-10 h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => toggleSort("name")}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortBy === "name" && <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadLocations();
                setShowLocationDialog(true);
              }}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              Manage Locations
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Modern Grid/List View */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-950 rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3">
                <Skeleton className="h-20 w-20 rounded-lg mx-auto" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-4">
              <Box className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {search ? "Try adjusting your search or filters" : "Get started by adding your first item"}
            </p>
            {!search && (
              <Button className="gap-2" asChild>
                <Link href="/inventory/new">
                  <Plus className="w-4 h-4" /> Add Your First Item
                </Link>
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white dark:bg-gray-950 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Box className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku || "N/A"}</p>
                  {item.barcode && (
                    <Badge variant="outline" className="text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      {item.barcode}
                    </Badge>
                  )}
                </div>
                {item.brand && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{item.brand}</p>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  {editingItem?.id === item.id && editingItem?.field === "stock" ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs w-20"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveInlineEdit();
                          if (e.key === "Escape") cancelInlineEdit();
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); saveInlineEdit(); }}>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); cancelInlineEdit(); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs cursor-pointer hover:ring-2 hover:ring-blue-500",
                        item.stockQuantity <= 0 
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                          : item.stockQuantity < 10
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      )}
                      onClick={(e) => { e.stopPropagation(); startInlineEdit(item.id, "stock", item.stockQuantity); }}
                    >
                      <Package className="w-3 h-3 mr-1" />
                      {item.stockQuantity}
                    </Badge>
                  )}
                  
                  {editingItem?.id === item.id && editingItem?.field === "price" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 text-xs w-24"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveInlineEdit();
                          if (e.key === "Escape") cancelInlineEdit();
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); saveInlineEdit(); }}>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); cancelInlineEdit(); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span 
                      className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); startInlineEdit(item.id, "price", item.sellingPrice); }}
                    >
                      {formatCurrency(item.sellingPrice, profile?.currency, profile?.currencyPos as any)}
                    </span>
                  )}
                </div>
                
                {item.category && (
                  <Badge variant="outline" className="text-xs w-fit">
                    {item.category.name}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 rounded-lg flex items-center justify-center">
                            <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.sku || "N/A"}</td>
                      <td className="px-4 py-3">
                        {editingItem?.id === item.id && editingItem?.field === "stock" ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-8 text-xs w-20"
                              value={editValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === "Enter") saveInlineEdit();
                                if (e.key === "Escape") cancelInlineEdit();
                              }}
                              autoFocus
                              onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                            />
                            <Button size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); saveInlineEdit(); }}>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); cancelInlineEdit(); }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs cursor-pointer hover:ring-2 hover:ring-blue-500",
                              item.stockQuantity <= 0 
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                                : item.stockQuantity < 10
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            )}
                            onClick={(e) => { e.stopPropagation(); startInlineEdit(item.id, "stock", item.stockQuantity); }}
                          >
                            {item.stockQuantity}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingItem?.id === item.id && editingItem?.field === "price" ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 text-xs w-24"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInlineEdit();
                                if (e.key === "Escape") cancelInlineEdit();
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); saveInlineEdit(); }}>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); cancelInlineEdit(); }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); startInlineEdit(item.id, "price", item.sellingPrice); }}
                          >
                            {formatCurrency(item.sellingPrice, profile?.currency, profile?.currencyPos as any)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.category ? (
                          <Badge variant="outline" className="text-xs">{item.category.name}</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStockAdjustItem(item); setStockAdjustType("ADD"); }}>
                              <PlusCircle className="w-4 h-4 mr-2" /> Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStockAdjustItem(item); setStockAdjustType("REDUCE"); }}>
                              <MinusCircle className="w-4 h-4 mr-2" /> Reduce Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                              <Link href={`/inventory/edit/${item.id}`}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); loadBatches(item.id); setShowBatchDialog(true); }}
                            >
                              <Layers className="w-4 h-4 mr-2" /> Manage Batches
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); loadVariants(item.id); setShowVariantDialog(true); }}
                            >
                              <GitBranch className="w-4 h-4 mr-2" /> Manage Variants
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-900/50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Delete Item</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!stockAdjustItem} onOpenChange={() => setStockAdjustItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {stockAdjustType === "ADD" ? "Add Stock" : "Reduce Stock"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {stockAdjustType === "ADD" ? "Add quantity to this item" : "Reduce quantity from this item"}
            </DialogDescription>
          </DialogHeader>
          {stockAdjustItem && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{stockAdjustItem.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Stock: {stockAdjustItem.stockQuantity} {stockAdjustItem.unit || "units"}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQty" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</Label>
                <Input
                  id="stockQty"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  className="text-sm"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStockAdjustItem(null)} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleStockAdjust} disabled={adjusting} className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              {adjusting ? "Processing..." : stockAdjustType === "ADD" ? "Add Stock" : "Reduce Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add Item</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Add a new item to your inventory with detailed information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item Name *</Label>
                  <Input
                    id="itemName"
                    placeholder="Enter item name"
                    className="text-sm"
                    value={quickAddItem.name}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemSku" className="text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</Label>
                  <Input
                    id="itemSku"
                    placeholder="Enter SKU"
                    className="text-sm"
                    value={quickAddItem.sku}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    className="text-sm"
                    value={quickAddItem.barcode}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, barcode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Unit</Label>
                  <Select value={quickAddItem.unit} onValueChange={(value) => setQuickAddItem({ ...quickAddItem, unit: value })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PCS">PCS</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="BOX">BOX</SelectItem>
                      <SelectItem value="PACK">PACK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Images</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="itemImages"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('itemImages')?.click()}
                    disabled={uploadingImage}
                    className="gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Upload Images
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {quickAddItem.images.length} image(s) selected
                  </span>
                </div>
                {quickAddItem.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {quickAddItem.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Product image ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-sm"
                    value={quickAddItem.purchasePrice}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, purchasePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selling Price</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-sm"
                    value={quickAddItem.sellingPrice}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, sellingPrice: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Stock Management */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Stock Management</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Initial Stock</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="text-sm"
                    value={quickAddItem.stockQuantity}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, stockQuantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    placeholder="10"
                    className="text-sm"
                    value={quickAddItem.reorderPoint}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, reorderPoint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStock" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    className="text-sm"
                    value={quickAddItem.maxStock}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, maxStock: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand"
                    className="text-sm"
                    value={quickAddItem.brand}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="Enter manufacturer"
                    className="text-sm"
                    value={quickAddItem.manufacturer}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    className="text-sm"
                    value={quickAddItem.weight}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dimensions</Label>
                  <Input
                    id="dimensions"
                    placeholder="LxWxH (cm)"
                    className="text-sm"
                    value={quickAddItem.dimensions}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, dimensions: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="shelfLocation" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Shelf Location</Label>
                  <Input
                    id="shelfLocation"
                    placeholder="e.g., Aisle 3, Shelf B"
                    className="text-sm"
                    value={quickAddItem.shelfLocation}
                    onChange={(e) => setQuickAddItem({ ...quickAddItem, shelfLocation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Supplier & Category */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category</Label>
                  <Select value={quickAddItem.categoryId} onValueChange={(value) => setQuickAddItem({ ...quickAddItem, categoryId: value })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</Label>
                  <Select value={quickAddItem.supplierId} onValueChange={(value) => setQuickAddItem({ ...quickAddItem, supplierId: value })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Supplier</SelectItem>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Description</h3>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter item description"
                  className="text-sm w-full min-h-[80px] p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={quickAddItem.description}
                  onChange={(e) => setQuickAddItem({ ...quickAddItem, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specifications" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Specifications</Label>
                <textarea
                  id="specifications"
                  placeholder="Enter technical specifications"
                  className="text-sm w-full min-h-[80px] p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={quickAddItem.specifications}
                  onChange={(e) => setQuickAddItem({ ...quickAddItem, specifications: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowQuickAdd(false)} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleQuickAdd} disabled={adding} className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              {adding ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Management Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Manage Batches</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Add and manage batch/lot information for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Existing Batches</h4>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Batch
              </Button>
            </div>
            {batches.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No batches found</p>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{batch.batchNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qty: {batch.quantity} | Exp: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Management Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Manage Locations</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Add and manage warehouse/storage locations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Existing Locations</h4>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Location
              </Button>
            </div>
            {locations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No locations found</p>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{location.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{location.address || 'No address'}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Management Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Manage Variants</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Add and manage product variants (size, color, etc.) for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Existing Variants</h4>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Variant
              </Button>
            </div>
            {variants.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No variants found</p>
            ) : (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{variant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {variant.attributeName}: {variant.attributeValue} | Stock: {variant.stockQuantity}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariantDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
