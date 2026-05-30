"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RotateCcw, Calendar, User, MoreHorizontal, Trash2, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getSalesReturns, deleteSalesReturn, updateSalesReturn } from "@/lib/actions/sales-returns";
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

export default function SalesReturnsPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReturn, setViewReturn] = useState<any>(null);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    const res = await getSalesReturns(activeProfileId!);
    if (res.data) setReturns(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) loadReturns();
  }, [activeProfileId, loadReturns]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    const res = await deleteSalesReturn(activeProfileId, deleteId);
    if ("error" in res && res.error) toast.error(res.error);
    else {
      toast.success("Sales return deleted successfully");
      loadReturns();
    }
    setDeleteId(null);
  };

  const handleApprove = async (returnId: string) => {
    if (!activeProfileId) return;
    const res = await updateSalesReturn(activeProfileId, returnId, {
      status: "COMPLETED",
    });
    if ("error" in res && res.error) toast.error(res.error);
    else {
      toast.success("Sales return approved and inventory updated");
      loadReturns();
    }
  };

  const filtered = returns.filter((r) => {
    const matchSearch =
      (r.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
      r.returnNo.toString().includes(search);
    return matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            COMPLETED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  if (loading && returns.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (returns.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="mb-6">
          <div className="w-32 h-32 mx-auto relative">
            <div className="w-24 h-28 bg-gray-100 rounded-lg mx-auto flex flex-col items-center justify-center border border-gray-200 relative">
              <div className="w-14 h-2 bg-gray-300 rounded mb-2" />
              <div className="w-10 h-2 bg-gray-200 rounded mb-1" />
              <div className="w-12 h-2 bg-gray-200 rounded mb-1" />
              <div className="w-8 h-2 bg-gray-200 rounded" />
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-300 rounded-t-lg" />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Sales Returns
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Process returns from customers and update inventory.
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-sm" asChild>
          <Link href="/sales/returns/new">
            <Plus className="w-4 h-4 mr-1.5" /> Create Sales Return
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">
          Sales Returns ({filtered.length})
        </h1>
        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-sm font-medium"
            asChild
          >
            <Link href="/sales/returns/new">
              <Plus className="w-4 h-4 mr-1" /> Create Sales Return
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search returns..."
            className="pl-8 h-8 text-sm border-border bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4 w-28">
                Return No
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4">
                Party Name
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4 w-32">
                Date
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4 w-24">
                Status
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 pr-4 w-32">
                Total Amount
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((returnItem) => (
              <tr
                key={returnItem.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => setViewReturn(returnItem)}
              >
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-foreground">
                    {returnItem.returnNo}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-muted-foreground">
                    {returnItem.party?.name || "Cash Sale"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(returnItem.date), "yyyy MMM dd")}
                  </span>
                </td>
                <td className="py-3 pr-4">{getStatusBadge(returnItem.status)}</td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-sm text-foreground">
                    {formatCurrency(
                      returnItem.grandTotal,
                      profile?.currency,
                      profile?.currencyPos as any
                    )}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {returnItem.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => handleApprove(returnItem.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Return
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(returnItem.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Return
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No returns found matching &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Return?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The inventory will be updated accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Return Dialog */}
      <Dialog open={!!viewReturn} onOpenChange={() => setViewReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Sales Return {viewReturn?.returnNo}
            </DialogTitle>
          </DialogHeader>

          {viewReturn && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/50">
                <div className="space-y-1.5">
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-20">Party:</span>
                    <span className="font-medium">{viewReturn.party?.name || "Cash Sale"}</span>
                  </div>
                  {viewReturn.party?.address && (
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-20">Address:</span>
                      <span>{viewReturn.party.address}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(viewReturn.date), "yyyy MMM dd")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span>{viewReturn.reason || "N/A"}</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs text-muted-foreground py-2 font-medium">S.N.</th>
                    <th className="text-left text-xs text-muted-foreground py-2 font-medium">Name</th>
                    <th className="text-left text-xs text-muted-foreground py-2 font-medium">Quantity</th>
                    <th className="text-left text-xs text-muted-foreground py-2 font-medium">Rate</th>
                    <th className="text-right text-xs text-muted-foreground py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewReturn.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.quantity} PCS</td>
                      <td className="py-2">
                        {formatCurrency(item.rate, profile?.currency, profile?.currencyPos as any)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(item.amount, profile?.currency, profile?.currencyPos as any)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1.5 text-sm">
                {viewReturn.remarks && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Remarks</p>
                    <p className="text-foreground">{viewReturn.remarks}</p>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border/50">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(viewReturn.grandTotal, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                {viewReturn.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setViewReturn(null);
                      handleApprove(viewReturn.id);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Return
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteId(viewReturn.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
