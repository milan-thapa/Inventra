"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, FileText, Download, MoreHorizontal, Trash2, Eye,
  Receipt, Calendar, User, Coins, CheckCircle2, Clock, XCircle,
  Edit, Copy, RotateCcw, Printer, Settings, ChevronDown, SortAsc
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getSales, deleteSale, recordPayment, createSale } from "@/lib/actions/sales";
import { createSalesReturn } from "@/lib/actions/sales-returns";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SalesInvoicePage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [sortBy, setSortBy] = useState<"date" | "invoiceNo" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewSale, setViewSale] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState<any>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    const res = await getSales(activeProfileId!);
    if (res.data) setSales(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) loadSales();
  }, [activeProfileId, loadSales]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    const res = await deleteSale(activeProfileId, deleteId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Sale invoice deleted and inventory updated");
      loadSales();
    }
    setDeleteId(null);
  };

  const handleDuplicate = async (sale: any) => {
    if (!activeProfileId) return;
    const res = await createSale(activeProfileId, {
      partyId: sale.partyId,
      items: sale.items.map((item: any) => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      totalAmount: sale.totalAmount,
      discount: sale.discount,
      tax: sale.tax,
      grandTotal: sale.grandTotal,
      paymentMethod: sale.paymentMethod,
      status: "UNPAID",
      remarks: sale.remarks,
      date: new Date(),
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Sale duplicated successfully");
      loadSales();
    }
  };

  const handleConvertToReturn = async (sale: any) => {
    if (!activeProfileId) return;
    const res = await createSalesReturn(activeProfileId, {
      saleId: sale.id,
      partyId: sale.partyId,
      items: sale.items.map((item: any) => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      totalAmount: sale.totalAmount,
      refundAmount: sale.grandTotal,
      reason: "Converted from sale",
      remarks: sale.remarks,
      date: new Date(),
    });
    if ("error" in res && res.error) toast.error(res.error);
    else {
      toast.success("Converted to sales return successfully");
      loadSales();
    }
  };

  const handleRecordPayment = async (
    saleId: string,
    amount: number,
    paymentMethod: string,
    remarks: string
  ) => {
    if (!activeProfileId) return;
    const res = await recordPayment(activeProfileId, saleId, {
      amount,
      paymentMethod,
      remarks,
      date: new Date(),
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Payment recorded successfully");
      setPaymentDialog(null);
      loadSales();
    }
  };

  const filtered = sales.filter((s) => {
    const matchSearch =
      (s.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
      s.invoiceNo.toString().includes(search);
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    
    let matchDate = true;
    if (dateFilter !== "ALL") {
      const saleDate = new Date(s.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === "TODAY") {
        matchDate = saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === "THIS_WEEK") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchDate = saleDate >= weekAgo && saleDate <= today;
      } else if (dateFilter === "THIS_MONTH") {
        matchDate = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === "CUSTOM") {
        const fromDate = customDateRange.from ? new Date(customDateRange.from) : null;
        const toDate = customDateRange.to ? new Date(customDateRange.to) : null;
        if (fromDate) matchDate = saleDate >= fromDate;
        if (toDate) matchDate = matchDate && saleDate <= toDate;
      }
    }
    
    return matchSearch && matchStatus && matchDate;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "invoiceNo") {
      comparison = a.invoiceNo - b.invoiceNo;
    } else if (sortBy === "amount") {
      comparison = a.grandTotal - b.grandTotal;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            PAID
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            UNPAID
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            PARTIAL
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

  if (loading && sales.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (sales.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="mb-6">
          {/* Invoice illustration matching Karobar */}
          <div className="w-32 h-32 mx-auto relative">
            <div className="w-24 h-28 bg-muted rounded-lg mx-auto flex flex-col items-center justify-center border border-border relative">
              <div className="w-14 h-2 bg-muted-foreground/30 rounded mb-2" />
              <div className="w-10 h-2 bg-muted-foreground/20 rounded mb-1" />
              <div className="w-12 h-2 bg-muted-foreground/20 rounded mb-1" />
              <div className="w-8 h-2 bg-muted-foreground/20 rounded" />
              {/* header bar */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-muted-foreground/30 rounded-t-lg" />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Create Your First Sales Invoice
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Click on the create sales invoice button and start managing your sales invoices.
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-sm" asChild>
          <Link href="/sales/new">
            <Plus className="w-4 h-4 mr-1.5" /> Create Sales Invoice
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">
          Sales Invoices ({filtered.length})
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-sm font-medium"
            asChild
          >
            <Link href="/sales/new">
              <Plus className="w-4 h-4 mr-1" /> Create Sales Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-3 border-b border-border/50">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8 h-8 text-sm border-border bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm font-normal border-border text-muted-foreground gap-1.5"
              >
                {statusFilter === "ALL" ? "All Status" : statusFilter}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              {["ALL", "PAID", "UNPAID", "PARTIAL"].map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(statusFilter === s && "font-medium")}
                >
                  {s === "ALL" ? "All Status" : s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm font-normal border-border text-muted-foreground gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                {dateFilter === "ALL" ? "All Date" : dateFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => setDateFilter("ALL")}>All Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("TODAY")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("THIS_WEEK")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("THIS_MONTH")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("CUSTOM")}>Custom Range</DropdownMenuItem>
              {dateFilter === "CUSTOM" && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2 space-y-2">
                    <Input
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm font-normal border-border text-muted-foreground gap-1.5"
              >
                <SortAsc className="w-3.5 h-3.5" />
                Sort By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("invoiceNo")}>
                Invoice No {sortBy === "invoiceNo" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount")}>
                Amount {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                Ascending {sortOrder === "asc" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                Descending {sortOrder === "desc" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4 w-28">
                Invoice No
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
              <th className="text-right text-xs font-medium text-muted-foreground py-3 pr-4 w-32">
                Unpaid Amount
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-border/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => setViewSale(sale)}
              >
                {/* Invoice No + thumbnail */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {sale.images?.[0] ? (
                        <img
                          src={sale.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {sale.invoiceNo}
                    </span>
                  </div>
                </td>

                {/* Party */}
                <td className="py-3 pr-4">
                  <span className="text-sm text-foreground">
                    {sale.party?.name || "Cash Sale"}
                  </span>
                </td>

                {/* Date */}
                <td className="py-3 pr-4">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(sale.date), "yyyy MMM dd")}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 pr-4">{getStatusBadge(sale.status)}</td>

                {/* Total */}
                <td className="py-3 pr-4 text-right">
                  <span className="text-sm text-foreground">
                    {formatCurrency(
                      sale.grandTotal,
                      profile?.currency,
                      profile?.currencyPos as any
                    )}
                  </span>
                </td>

                {/* Unpaid */}
                <td className="py-3 pr-4 text-right">
                  <span className="text-sm text-muted-foreground">
                    {sale.status === "PAID"
                      ? "--"
                      : formatCurrency(
                          sale.remainingAmount || 0,
                          profile?.currency,
                          profile?.currencyPos as any
                        )}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Three-dot menu */}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/sales/${sale.id}/edit`} className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" /> Edit Sales Invoice
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(sale)}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate Transaction
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvertToReturn(sale)}>
                          <RotateCcw className="w-4 h-4 mr-2" /> Convert to Sales Return
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(sale.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Sales Invoice
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
              No invoices found matching &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Invoice?</AlertDialogTitle>
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

      {/* View Invoice Dialog — matches Karobar modal */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Sales Invoice {viewSale?.invoiceNo}
            </DialogTitle>
          </DialogHeader>

          {viewSale && (
            <div className="space-y-4 text-sm">
              {/* Party / Invoice meta */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/50">
                <div className="space-y-1.5">
                  <div className="flex gap-8">
                    <span className="text-muted-foreground w-20">Party:</span>
                    <span className="font-medium">{viewSale.party?.name || "Cash Sale"}</span>
                  </div>
                  {viewSale.party?.address && (
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-20">Address:</span>
                      <span>{viewSale.party.address}</span>
                    </div>
                  )}
                  {viewSale.party?.phone && (
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-20">Phone No.</span>
                      <span>{viewSale.party.phone}</span>
                    </div>
                  )}
                  {viewSale.party?.balance !== undefined && (
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-20">Balance:</span>
                      <span className="text-red-500 font-medium">
                        {formatCurrency(viewSale.party.balance, profile?.currency, profile?.currencyPos as any)} (To Give)
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice No</span>
                    <span className="font-medium text-emerald-600">{viewSale.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span>{format(new Date(viewSale.date), "yyyy MMM dd")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span>{viewSale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items table */}
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
                  {viewSale.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/30">
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

              {/* Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {viewSale.remarks && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Remarks</p>
                      <p className="text-foreground">{viewSale.remarks}</p>
                    </div>
                  )}
                  {viewSale.images?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Images</p>
                      <div className="flex gap-2 flex-wrap">
                        {viewSale.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-16 h-16 object-cover rounded border border-border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sub Total:</span>
                    <span>{formatCurrency(viewSale.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                  {viewSale.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount (10%):</span>
                      <span>{formatCurrency(viewSale.discount, profile?.currency, profile?.currencyPos as any)}</span>
                    </div>
                  )}
                  {viewSale.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (13%):</span>
                      <span>{formatCurrency(viewSale.tax, profile?.currency, profile?.currencyPos as any)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(viewSale.grandTotal, profile?.currency, profile?.currencyPos as any)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received Amount:</span>
                    <span>
                      {formatCurrency(viewSale.receivedAmount || viewSale.grandTotal, profile?.currency, profile?.currencyPos as any)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dialog actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        More Actions <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setViewSale(null); setPaymentDialog(viewSale); }}>
                        <Coins className="w-4 h-4 mr-2" /> Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className="w-4 h-4 mr-2" /> Convert to Return
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteId(viewSale.id)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/sales/${viewSale.id}/edit`}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5" /> Print PDF
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {paymentDialog && (
        <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Record Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              sale={paymentDialog}
              onSubmit={handleRecordPayment}
              onCancel={() => setPaymentDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PaymentForm({
  sale,
  onSubmit,
  onCancel,
}: {
  sale: any;
  onSubmit: (id: string, amount: number, method: string, remarks: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(sale.remainingAmount?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert("Enter a valid amount");
    if (num > sale.remainingAmount) return alert(`Cannot exceed ${sale.remainingAmount}`);
    onSubmit(sale.id, num, paymentMethod, remarks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Amount</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full h-9 px-3 text-sm border border-border rounded-md"
        >
          <option value="CASH">Cash</option>
          <option value="BANK">Bank Transfer</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Remarks</label>
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional"
          className="h-9 text-sm"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          Record Payment
        </Button>
      </div>
    </form>
  );
}