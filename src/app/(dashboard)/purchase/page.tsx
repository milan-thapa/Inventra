"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ShoppingCart, Search, Filter, FileText, Download, MoreHorizontal, Trash2, RotateCcw, Eye, Receipt, Calendar, User, ArrowRight, DollarSign, CheckCircle2, Clock, XCircle, ArrowDownLeft, FileCheck, Package } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PurchasePage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPurchase, setViewPurchase] = useState<any>(null);

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
          <Button variant="outline" asChild>
            <Link href="/purchase/returns">
              <RotateCcw className="w-4 h-4 mr-2" /> Returns
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/purchase/out">
              <ArrowDownLeft className="w-4 h-4 mr-2" /> Purchase Out
            </Link>
          </Button>
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

      {/* Card-based layout like Karobar app */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPurchases.map((purchase) => (
          <div key={purchase.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">#{purchase.billNo}</h3>
                  <p className="text-xs text-muted-foreground">{format(new Date(purchase.date), "dd MMM yyyy")}</p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                purchase.status === "PAID" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                purchase.status === "PARTIAL" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {purchase.status === "PAID" ? <CheckCircle2 className="w-3 h-3" /> :
                 purchase.status === "PARTIAL" ? <Clock className="w-3 h-3" /> :
                 <XCircle className="w-3 h-3" />}
                {purchase.status}
              </span>
            </div>

            {/* Supplier */}
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{purchase.party?.name || "Cash Purchase"}</span>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(purchase.grandTotal, profile?.currency, profile?.currencyPos as any)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setViewPurchase(purchase)}
              >
                <Eye className="w-4 h-4 mr-2" /> View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
              >
                <Receipt className="w-4 h-4 mr-2" /> Print
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
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
            </div>
          </div>
        ))}
      </div>

      {filteredPurchases.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No purchase bills found matching &quot;{search}&quot;</p>
        </div>
      )}

      {/* View Purchase Dialog */}
      {viewPurchase && (
        <Dialog open={!!viewPurchase} onOpenChange={() => setViewPurchase(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Bill #{viewPurchase.billNo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(viewPurchase.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{viewPurchase.party?.name || "Cash Purchase"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    viewPurchase.status === "PAID" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    viewPurchase.status === "PARTIAL" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}>
                    {viewPurchase.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{viewPurchase.paymentMethod}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Items</h4>
                <div className="space-y-2">
                  {viewPurchase.items.map((item: any, idx: number) => (
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
                  <span className="font-medium">{formatCurrency(viewPurchase.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
                {viewPurchase.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-emerald-600">-{formatCurrency(viewPurchase.discount, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                {viewPurchase.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(viewPurchase.tax, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Grand Total</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(viewPurchase.grandTotal, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              {viewPurchase.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-foreground">{viewPurchase.remarks}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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
