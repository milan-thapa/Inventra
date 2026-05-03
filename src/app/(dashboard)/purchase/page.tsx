"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ShoppingCart, Search, Filter, FileText, Download, MoreHorizontal, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getPurchases, deletePurchase } from "@/lib/actions/purchases";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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

export default function PurchasePage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    const res = await getPurchases(activeProfileId!);
    if (res.data) setPurchases(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadPurchases();
    }
  }, [activeProfileId, loadPurchases]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    
    const res = await deletePurchase(activeProfileId, deleteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Purchase bill deleted and inventory updated");
      loadPurchases();
    }
    setDeleteId(null);
  };

  const filteredPurchases = purchases.filter(purchase => 
    (purchase.party?.name || "Cash Purchase").toLowerCase().includes(search.toLowerCase()) || 
    purchase.billNo.toString().includes(search)
  );

  if (loading && purchases.length === 0) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (purchases.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-32 h-32 bg-secondary/50 rounded-full flex items-center justify-center mb-6 relative">
            <div className="bg-card border-2 border-border p-4 rounded-lg shadow-sm">
                <FileText className="w-12 h-12 text-muted-foreground" />
                <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-8 bg-muted rounded" />
                    <div className="h-1.5 w-6 bg-muted rounded" />
                </div>
            </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Record Your First Purchase Bill</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Click on the record purchase bill button and start managing your business purchases
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/purchase/new">
            <Plus className="w-4 h-4 mr-2" /> Record Purchase Bill
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Purchase Bills</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/purchase/new">
              <Plus className="w-4 h-4 mr-2" /> Record Purchase Bill
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by supplier name or bill number..." 
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
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Bill No</th>
                <th className="px-6 py-4 font-semibold">Party Name</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{format(new Date(purchase.date), "dd MMM yyyy")}</td>
                  <td className="px-6 py-4 font-medium">#{purchase.billNo}</td>
                  <td className="px-6 py-4">{purchase.party?.name || "Cash Purchase"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      purchase.status === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    )}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-600">
                    {formatCurrency(purchase.grandTotal, profile?.currency, profile?.currencyPos as any)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Bill
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No purchase bills found matching &quot;{search}&quot;
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
            <AlertDialogTitle>Delete this Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the purchase record and **automatically remove these items from your inventory stock**. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
