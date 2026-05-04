"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Package, Search, Filter, Download, Upload, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getItems, deleteItem } from "@/lib/actions/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { toast } from "sonner";

export default function InventoryPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await getItems(activeProfileId!);
    if (res.data) setItems(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadItems();
    }
  }, [activeProfileId, loadItems]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    
    const res = await deleteItem(activeProfileId, deleteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item deleted successfully");
      loadItems();
    }
    setDeleteId(null);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading && items.length === 0) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
            <div className="relative">
                <Package className="w-12 h-12 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Let&apos;s add your First Item</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Click on the add new item button and start managing your items
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 mr-2" /> Add New Item
            </Link>
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" /> Import Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/categories">
              <Filter className="w-4 h-4 mr-2" /> Manage Categories
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 mr-2" /> Add New Item
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search items by name or sku..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Item Name</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold text-right">Stock Quantity</th>
                <th className="px-6 py-4 font-semibold text-right">Purchase Price</th>
                <th className="px-6 py-4 font-semibold text-right">Selling Price</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.sku || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={cn(
                      "inline-flex items-center justify-end gap-1 px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap",
                      item.stockQuantity <= 0 
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" 
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}>
                      <span className="opacity-70">Qty:</span>
                      <span>{item.stockQuantity}</span>
                      <span className="opacity-70 ml-0.5">{item.unit || "Units"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.purchasePrice, profile?.currency, profile?.currencyPos as any)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.sellingPrice, profile?.currency, profile?.currencyPos as any)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/inventory/edit/${item.id}`}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No items found matching &quot;{search}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
