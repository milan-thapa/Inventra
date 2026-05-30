"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RotateCcw, FileText, Trash2, CheckCircle2, Clock, User, Calendar, ArrowRight, XCircle, Package, ArrowDownLeft } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getPurchaseReturns, deletePurchaseReturn, updatePurchaseReturn } from "@/lib/actions/purchase-returns";
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

export default function PurchaseReturnsPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReturn, setViewReturn] = useState<any>(null);

  const loadPurchaseReturns = useCallback(async () => {
    setLoading(true);
    const res = await getPurchaseReturns(activeProfileId!);
    if (res.data) setPurchaseReturns(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadPurchaseReturns();
    }
  }, [activeProfileId, loadPurchaseReturns]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    
    const res = await deletePurchaseReturn(activeProfileId, deleteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Purchase return deleted successfully");
      loadPurchaseReturns();
    }
    setDeleteId(null);
  };

  const handleApproveReturn = async (returnId: string) => {
    if (!activeProfileId) return;

    const res = await updatePurchaseReturn(activeProfileId, returnId, {
      status: "COMPLETED",
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Purchase return approved and inventory updated");
      loadPurchaseReturns();
    }
  };

  const filteredReturns = purchaseReturns.filter(returnItem =>
    (returnItem.party?.name || "Cash Purchase").toLowerCase().includes(search.toLowerCase()) ||
    returnItem.returnNo.toString().includes(search)
  );

  if (loading && purchaseReturns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-2 border-b border-border/50">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (purchaseReturns.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-32 h-32 bg-secondary/50 rounded-full flex items-center justify-center mb-6 relative">
          <div className="bg-card border-2 border-border p-4 rounded-lg shadow-sm">
            <RotateCcw className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">No Purchase Returns Yet</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Record purchase returns to manage refunds and inventory adjustments
        </p>
        <Button variant="emerald" asChild>
          <Link href="/purchase/returns/new">
            <Plus className="w-4 h-4 mr-2" /> Create Purchase Return
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/purchase">
            <Button variant="ghost" size="icon">
              <ArrowDownLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Purchase Returns</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/purchase/returns/new">
            <Plus className="w-4 h-4 mr-2" /> New Return
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by supplier name or return number..." 
          className="pl-10 h-11" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Purchase Return Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReturns.map((returnItem) => (
          <div key={returnItem.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all cursor-pointer" onClick={() => setViewReturn(returnItem)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">#{returnItem.returnNo}</h3>
                  <p className="text-xs text-muted-foreground">{format(new Date(returnItem.date), "dd MMM yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  returnItem.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  returnItem.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                  returnItem.status === "REJECTED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                  "bg-slate-500/10 text-slate-600 border-slate-500/20"
                )}>
                  {returnItem.status === "COMPLETED" && <CheckCircle2 className="w-4 h-4" />}
                  {returnItem.status === "REJECTED" && <XCircle className="w-4 h-4" />}
                  {returnItem.status === "PENDING" && <Clock className="w-4 h-4" />}
                  {returnItem.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(returnItem.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{returnItem.party?.name || "Cash Purchase"}</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {returnItem.purchase ? `Bill #${returnItem.purchase.billNo}` : "No Purchase Linked"}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(returnItem.totalAmount, profile?.currency, profile?.currencyPos as any)}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Refund Amount</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(returnItem.refundAmount, profile?.currency, profile?.currencyPos as any)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {returnItem.status === "PENDING" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-emerald-600 border-emerald-600" 
                  onClick={(e) => { e.stopPropagation(); handleApproveReturn(returnItem.id); }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredReturns.length === 0 && (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No purchase returns found matching &quot;{search}&quot;</p>
          <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or create a new purchase return</p>
          <Button variant="emerald" asChild>
            <Link href="/purchase/returns/new">
              <Plus className="w-4 h-4 mr-2" /> Create Purchase Return
            </Link>
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewReturn} onOpenChange={() => setViewReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Purchase Return Details</DialogTitle>
          </DialogHeader>
          {viewReturn && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Return Number</p>
                  <p className="text-xl font-bold text-foreground">#{viewReturn.returnNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-semibold text-foreground">{viewReturn.party?.name || "Cash Purchase"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">{format(new Date(viewReturn.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    viewReturn.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    viewReturn.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    viewReturn.status === "REJECTED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                    "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  )}>
                    {viewReturn.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Returned Items</h4>
                <div className="space-y-2">
                  {viewReturn.items.map((item: any, idx: number) => (
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
                  <span className="text-muted-foreground">Total Return Amount</span>
                  <span className="font-medium">{formatCurrency(viewReturn.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Refund Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(viewReturn.refundAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Reason for Return</p>
                <p className="text-foreground">{viewReturn.reason}</p>
              </div>

              {viewReturn.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-foreground">{viewReturn.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Purchase Return?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the purchase return record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
