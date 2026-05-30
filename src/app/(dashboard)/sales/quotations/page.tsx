"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, FileText, Calendar, User, MoreHorizontal, Trash2, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getQuotations, deleteQuotation, convertQuotationToSale } from "@/lib/actions/quotations";
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

export default function QuotationsPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewQuotation, setViewQuotation] = useState<any>(null);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    const res = await getQuotations(activeProfileId!);
    if (res.data) setQuotations(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) loadQuotations();
  }, [activeProfileId, loadQuotations]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    const res = await deleteQuotation(activeProfileId, deleteId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Quotation deleted successfully");
      loadQuotations();
    }
    setDeleteId(null);
  };

  const handleConvertToSale = async (quotationId: string) => {
    if (!activeProfileId) return;
    const res = await convertQuotationToSale(quotationId, activeProfileId, {
      paymentMethod: "CASH",
      status: "COMPLETED",
      date: new Date(),
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Quotation converted to sale successfully");
      loadQuotations();
    }
  };

  const filtered = quotations.filter((q) => {
    const matchSearch =
      (q.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNo.toString().includes(search);
    return matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONVERTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            CONVERTED
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

  if (loading && quotations.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (quotations.length === 0 && !loading) {
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
          No Quotations
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Create quotations for your customers and convert them to sales.
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-sm" asChild>
          <Link href="/sales/quotations/new">
            <Plus className="w-4 h-4 mr-1.5" /> Create Quotation
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
          Quotations ({filtered.length})
        </h1>
        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-sm font-medium"
            asChild
          >
            <Link href="/sales/quotations/new">
              <Plus className="w-4 h-4 mr-1" /> Create Quotation
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
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
                Quotation No
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
            {filtered.map((quotation) => (
              <tr
                key={quotation.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => setViewQuotation(quotation)}
              >
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-foreground">
                    {quotation.quotationNo}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-muted-foreground">
                    {quotation.party?.name || "Cash Sale"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(quotation.date), "yyyy MMM dd")}
                  </span>
                </td>
                <td className="py-3 pr-4">{getStatusBadge(quotation.status)}</td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-sm text-foreground">
                    {formatCurrency(
                      quotation.grandTotal,
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
                        {quotation.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => handleConvertToSale(quotation.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Convert to Sale
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(quotation.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Quotation
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
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No quotations found matching &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* View Quotation Dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Quotation {viewQuotation?.quotationNo}
            </DialogTitle>
          </DialogHeader>

          {viewQuotation && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/50">
                <div className="space-y-1.5">
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-20">Party:</span>
                    <span className="font-medium">{viewQuotation.party?.name || "Cash Sale"}</span>
                  </div>
                  {viewQuotation.party?.address && (
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-20">Address:</span>
                      <span>{viewQuotation.party.address}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(viewQuotation.date), "yyyy MMM dd")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span>{viewQuotation.validUntil ? format(new Date(viewQuotation.validUntil), "yyyy MMM dd") : "N/A"}</span>
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
                  {viewQuotation.items?.map((item: any, i: number) => (
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
                {viewQuotation.remarks && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Remarks</p>
                    <p className="text-foreground">{viewQuotation.remarks}</p>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border/50">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(viewQuotation.grandTotal, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                {viewQuotation.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setViewQuotation(null);
                      handleConvertToSale(viewQuotation.id);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Convert to Sale
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteId(viewQuotation.id)}
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
