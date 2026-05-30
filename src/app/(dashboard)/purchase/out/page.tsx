"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Package, ArrowDownLeft, Trash2, MoreHorizontal, User, Calendar, Coins, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PurchaseOutPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [purchaseOuts, setPurchaseOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPurchaseOut, setViewPurchaseOut] = useState<any>(null);

  const loadPurchaseOuts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/purchase-out?profileId=${activeProfileId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchaseOuts(data.purchaseOuts || []);
      }
    } catch (error) {
      console.error("Failed to load purchase outs:", error);
    }
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadPurchaseOuts();
    }
  }, [activeProfileId, loadPurchaseOuts]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    
    try {
      const response = await fetch(`/api/purchase-out/${deleteId}?profileId=${activeProfileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Purchase out deleted successfully");
        setDeleteId(null);
        loadPurchaseOuts();
      } else {
        toast.error("Failed to delete purchase out");
      }
    } catch (error) {
      toast.error("Failed to delete purchase out");
    }
  };

  const filteredPurchaseOuts = purchaseOuts.filter(purchaseOut => 
    (purchaseOut.party?.name || "").toLowerCase().includes(search.toLowerCase()) || 
    purchaseOut.billNo.toString().includes(search)
  );

  if (loading && purchaseOuts.length === 0) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (purchaseOuts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-32 h-32 bg-secondary/50 rounded-full flex items-center justify-center mb-6 relative">
            <div className="bg-card border-2 border-border p-4 rounded-lg shadow-sm">
                <Package className="w-12 h-12 text-muted-foreground" />
                <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-8 bg-muted rounded" />
                    <div className="h-1.5 w-6 bg-muted rounded" />
                </div>
            </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Record Your First Purchase Out</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Click on the record purchase out button and start managing your purchase out transactions
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/purchase/out/new">
            <Plus className="w-4 h-4 mr-2" /> Record Purchase Out
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/purchase">
            <Button variant="ghost" size="icon">
              <ArrowDownLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Purchase Out</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/purchase/out/new">
              <Plus className="w-4 h-4 mr-2" /> Record Purchase Out
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by party name or bill number..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Card-based layout like Karobar app */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPurchaseOuts.map((purchaseOut) => (
          <div key={purchaseOut.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all group cursor-pointer" onClick={() => setViewPurchaseOut(purchaseOut)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 flex items-center justify-center border border-purple-500/20">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">#{purchaseOut.billNo}</h3>
                  <p className="text-xs text-muted-foreground">{format(new Date(purchaseOut.date), "dd MMM yyyy")}</p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                purchaseOut.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                purchaseOut.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {purchaseOut.status === "COMPLETED" ? <CheckCircle2 className="w-3 h-3" /> :
                 purchaseOut.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                 <XCircle className="w-3 h-3" />}
                {purchaseOut.status}
              </span>
            </div>

            {/* Party */}
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{purchaseOut.party?.name || "Cash"}</span>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(purchaseOut.totalAmount, profile?.currency, profile?.currencyPos as any)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(purchaseOut.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {filteredPurchaseOuts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No purchase outs found matching &quot;{search}&quot;</p>
        </div>
      )}

      {/* View Purchase Out Dialog */}
      {viewPurchaseOut && (
        <Dialog open={!!viewPurchaseOut} onOpenChange={() => setViewPurchaseOut(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Out #{viewPurchaseOut.billNo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(viewPurchaseOut.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">{viewPurchaseOut.party?.name || "Cash"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    viewPurchaseOut.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    viewPurchaseOut.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}>
                    {viewPurchaseOut.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{viewPurchaseOut.paymentMethod}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Items</h4>
                <div className="space-y-2">
                  {viewPurchaseOut.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatCurrency(item.rate, profile?.currency, profile?.currencyPos as any)}</p>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(item.amount, profile?.currency, profile?.currencyPos as any)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatCurrency(viewPurchaseOut.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
                {viewPurchaseOut.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-emerald-600">-{formatCurrency(viewPurchaseOut.discount, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Grand Total</span>
                  <span className="text-2xl font-bold text-purple-600">{formatCurrency(viewPurchaseOut.grandTotal, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              {viewPurchaseOut.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-foreground">{viewPurchaseOut.remarks}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Purchase Out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the purchase out record. This action cannot be undone.
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
