"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, FileText, Download, MoreHorizontal, Trash2, Eye, Receipt, Calendar, User, ArrowRight, DollarSign, CheckCircle2, Clock, XCircle, ArrowDownLeft, FileCheck, RotateCcw } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getSales, deleteSale, updateSale, recordPayment } from "@/lib/actions/sales";
import { getQuotations, deleteQuotation, convertQuotationToSale } from "@/lib/actions/quotations";
import { getSalesReturns, deleteSalesReturn, updateSalesReturn } from "@/lib/actions/sales-returns";
import { getPaymentTransactions, deletePaymentTransaction } from "@/lib/actions/party";
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
import { usePathname } from "next/navigation";

export default function SalesPage() {
  const pathname = usePathname();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [sales, setSales] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"sale" | "payment" | "quotation" | "return" | null>(null);
  const [editSale, setEditSale] = useState<any | null>(null);
  const [viewSale, setViewSale] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState<any>(null);
  const [viewPayment, setViewPayment] = useState<any>(null);
  const [viewQuotation, setViewQuotation] = useState<any>(null);
  const [viewReturn, setViewReturn] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("invoices");

  const loadSales = useCallback(async () => {
    setLoading(true);
    const res = await getSales(activeProfileId!);
    if (res.data) setSales(res.data);
    setLoading(false);
  }, [activeProfileId]);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    const res = await getQuotations(activeProfileId!);
    if (res.data) setQuotations(res.data);
    setLoading(false);
  }, [activeProfileId]);

  const loadSalesReturns = useCallback(async () => {
    setLoading(true);
    const res = await getSalesReturns(activeProfileId!);
    if (res.data) setSalesReturns(res.data);
    setLoading(false);
  }, [activeProfileId]);

  const loadPaymentTransactions = useCallback(async () => {
    setLoading(true);
    const res = await getPaymentTransactions(activeProfileId!);
    if (res.data) setPaymentTransactions(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      if (activeTab === "invoices") {
        loadSales();
      } else if (activeTab === "quotations") {
        loadQuotations();
      } else if (activeTab === "returns") {
        loadSalesReturns();
      } else if (activeTab === "payments") {
        loadPaymentTransactions();
      }
    }
  }, [activeProfileId, activeTab, loadSales, loadQuotations, loadSalesReturns, loadPaymentTransactions]);

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId || !deleteType) return;

    let res;
    if (deleteType === "sale") {
      res = await deleteSale(activeProfileId, deleteId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Sale invoice deleted and inventory updated");
        loadSales();
      }
    } else if (deleteType === "payment") {
      res = await deletePaymentTransaction(activeProfileId, deleteId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment deleted successfully");
        loadPaymentTransactions();
      }
    } else if (deleteType === "quotation") {
      res = await deleteQuotation(activeProfileId, deleteId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Quotation deleted successfully");
        loadQuotations();
      }
    } else if (deleteType === "return") {
      res = await deleteSalesReturn(activeProfileId, deleteId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Sales return deleted successfully");
        loadSalesReturns();
      }
    }
    setDeleteId(null);
    setDeleteType(null);
  };

  const handleConvertQuotation = async (quotationId: string) => {
    if (!activeProfileId) return;

    const res = await convertQuotationToSale(quotationId, activeProfileId, {
      paymentMethod: "CASH",
      status: "COMPLETED",
      date: new Date(),
    });
    if ("error" in res) {
      toast.error(res.error);
    } else {
      toast.success("Quotation converted to sale successfully");
      loadQuotations();
      loadSales();
    }
  };

  const handleApproveReturn = async (returnId: string) => {
    if (!activeProfileId) return;

    const res = await updateSalesReturn(activeProfileId, returnId, {
      status: "COMPLETED",
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sales return approved and inventory updated");
      loadSalesReturns();
    }
  };

  const handleRecordPayment = async (saleId: string, amount: number, paymentMethod: string, remarks: string) => {
    if (!activeProfileId) return;

    const res = await recordPayment(activeProfileId, saleId, {
      amount,
      paymentMethod,
      remarks,
      date: new Date(),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Payment recorded successfully");
      setPaymentDialog(null);
      loadSales();
    }
  };

  const handleEditSale = async (saleId: string, updatedData: any) => {
    if (!activeProfileId) return;

    const res = await updateSale(activeProfileId, saleId, updatedData);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Invoice updated successfully");
      setEditSale(null);
      loadSales();
    }
  };

  const filteredSales = sales.filter(sale => 
    (sale.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) || 
    sale.invoiceNo.toString().includes(search)
  );

  const filteredQuotations = quotations.filter(quotation =>
    (quotation.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
    quotation.quotationNo.toString().includes(search)
  );

  const filteredReturns = salesReturns.filter(returnItem =>
    (returnItem.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
    returnItem.returnNo.toString().includes(search)
  );

  const filteredPayments = paymentTransactions.filter(transaction =>
    (transaction.party?.name || "Cash Sale").toLowerCase().includes(search.toLowerCase()) ||
    transaction.receiptNumber.toString().includes(search)
  );

  if (loading && sales.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex items-center gap-2 border-b border-border/50">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (sales.length === 0 && !loading) {
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
        <h2 className="text-2xl font-bold mb-2">Create Your First Sales Invoice</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Click on the create sales invoice button and start managing your sales
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/sales/new">
            <Plus className="w-4 h-4 mr-2" /> Create Sales Invoice
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="w-4 h-4" />;
      case "UNPAID":
        return <XCircle className="w-4 h-4" />;
      case "PARTIAL":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "UNPAID":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "PARTIAL":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">Manage your sales, payments, quotations, and returns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          {activeTab === "invoices" && (
            <Button variant="emerald" asChild>
              <Link href="/sales/new">
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Link>
            </Button>
          )}
          {activeTab === "payments" && (
            <Button variant="emerald" asChild>
              <Link href="/sales/payment-in/new">
                <Plus className="w-4 h-4 mr-2" /> Add Payment
              </Link>
            </Button>
          )}
          {activeTab === "quotations" && (
            <Button variant="emerald" asChild>
              <Link href="/sales/quotations/new">
                <Plus className="w-4 h-4 mr-2" /> Create Quotation
              </Link>
            </Button>
          )}
          {activeTab === "returns" && (
            <Button variant="emerald" asChild>
              <Link href="/sales/returns/new">
                <Plus className="w-4 h-4 mr-2" /> Add Return
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "invoices"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="w-4 h-4" />
          Sales Invoices
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "payments"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Payment In
        </button>
        <button
          onClick={() => setActiveTab("quotations")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "quotations"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileCheck className="w-4 h-4" />
          Quotations
        </button>
        <button
          onClick={() => setActiveTab("returns")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "returns"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <RotateCcw className="w-4 h-4" />
          Sales Returns
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "invoices" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name or invoice number..." 
              className="pl-10 h-11" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Invoice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">#{sale.invoiceNo}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(sale.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    getStatusColor(sale.status)
                  )}>
                    {getStatusIcon(sale.status)}
                    {sale.status}
                  </span>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{sale.party?.name || "Cash Sale"}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{format(new Date(sale.date), "dd MMM yyyy")}</span>
                  {sale.dueDate && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className={cn(
                        "text-sm",
                        new Date(sale.dueDate) < new Date() && sale.status !== "PAID" 
                          ? "text-destructive font-medium" 
                          : "text-foreground"
                      )}>
                        Due: {format(new Date(sale.dueDate), "dd MMM yyyy")}
                      </span>
                    </>
                  )}
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(sale.grandTotal, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewSale(sale)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  {(sale.status === "UNPAID" || sale.status === "PARTIAL") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setPaymentDialog(sale)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" /> Pay
                    </Button>
                  )}
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
                        onClick={() => setDeleteId(sale.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Void Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No sales invoices found matching &quot;{search}&quot;</p>
              <p className="text-sm text-muted-foreground mb-6">Create sales invoices to track your sales transactions and manage inventory</p>
              <Button variant="emerald" asChild>
                <Link href="/sales/new">
                  <Plus className="w-4 h-4 mr-2" /> Create Invoice
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "payments" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name..." 
              className="pl-10 h-11" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Payment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPayments.map((transaction) => (
              <div key={transaction.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center border border-blue-500/20">
                      <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">#{transaction.receiptNumber}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      RECEIVED
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeleteId(transaction.id);
                        setDeleteType("payment");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{transaction.party?.name || "Cash Sale"}</span>
                </div>

                <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(transaction.amount, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => setViewPayment(transaction)}>
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </Button>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <ArrowDownLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No payments found matching &quot;{search}&quot;</p>
              <p className="text-sm text-muted-foreground mb-6">Start by adding your first payment to track customer transactions</p>
              <Button variant="emerald" asChild>
                <Link href="/sales/payment-in/new">
                  <Plus className="w-4 h-4 mr-2" /> Add Payment
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "quotations" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name or quotation number..." 
              className="pl-10 h-11" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quotation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuotations.map((quotation) => (
              <div key={quotation.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 flex items-center justify-center border border-purple-500/20">
                      <FileCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">#{quotation.quotationNo}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(quotation.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      quotation.status === "CONVERTED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      quotation.status === "ACCEPTED" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                      quotation.status === "SENT" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    )}>
                      {quotation.status === "CONVERTED" && <CheckCircle2 className="w-4 h-4" />}
                      {quotation.status === "ACCEPTED" && <CheckCircle2 className="w-4 h-4" />}
                      {quotation.status === "SENT" && <Clock className="w-4 h-4" />}
                      {quotation.status === "DRAFT" && <Clock className="w-4 h-4" />}
                      {quotation.status}
                    </span>
                    {quotation.status !== "CONVERTED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteId(quotation.id);
                          setDeleteType("quotation");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{quotation.party?.name || "Cash Sale"}</span>
                </div>

                <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(quotation.grandTotal, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewQuotation(quotation)}>
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  {quotation.status !== "CONVERTED" && (
                    <Button variant="outline" size="sm" className="flex-1 text-emerald-600 border-emerald-600" onClick={() => handleConvertQuotation(quotation.id)}>
                      <ArrowRight className="w-4 h-4 mr-2" /> Convert
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredQuotations.length === 0 && (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No quotations found matching &quot;{search}&quot;</p>
              <p className="text-sm text-muted-foreground mb-6">Create quotations to provide price estimates to customers and convert them to sales</p>
              <Button variant="emerald" asChild>
                <Link href="/sales/quotations/new">
                  <Plus className="w-4 h-4 mr-2" /> Create Quotation
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "returns" && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name or return number..." 
              className="pl-10 h-11" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sales Return Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReturns.map((returnItem) => (
              <div key={returnItem.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-600/5 flex items-center justify-center border border-rose-500/20">
                      <RotateCcw className="w-5 h-5 text-rose-600" />
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
                      returnItem.status === "REJECTED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
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
                      onClick={() => {
                        setDeleteId(returnItem.id);
                        setDeleteType("return");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{returnItem.party?.name || "Cash Sale"}</span>
                </div>

                <div className="flex items-center justify-between mb-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Refund Amount</span>
                  <span className="text-lg font-bold text-rose-600">
                    {formatCurrency(returnItem.refundAmount, profile?.currency, profile?.currencyPos as any)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewReturn(returnItem)}>
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  {returnItem.status === "PENDING" && (
                    <Button variant="outline" size="sm" className="flex-1 text-emerald-600 border-emerald-600" onClick={() => handleApproveReturn(returnItem.id)}>
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
              <p className="text-muted-foreground mb-4">No sales returns found matching &quot;{search}&quot;</p>
              <p className="text-sm text-muted-foreground mb-6">Process customer returns and refunds to maintain accurate inventory and customer satisfaction</p>
              <Button variant="emerald" asChild>
                <Link href="/sales/returns/new">
                  <Plus className="w-4 h-4 mr-2" /> Add Return
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {/* View Invoice Dialog */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex items-start justify-between pb-4 border-b border-border/50">
                <div>
                  <h3 className="text-xl font-bold text-foreground">#{viewSale.invoiceNo}</h3>
                  <p className="text-sm text-muted-foreground">{format(new Date(viewSale.date), "dd MMM yyyy")}</p>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                  getStatusColor(viewSale.status)
                )}>
                  {getStatusIcon(viewSale.status)}
                  {viewSale.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{viewSale.party?.name || "Cash Sale"}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Items</h4>
                <div className="space-y-2">
                  {viewSale.items.map((item: any, idx: number) => (
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

              {/* Summary */}
              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(viewSale.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
                {viewSale.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-rose-600">-{formatCurrency(viewSale.discount, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                {viewSale.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(viewSale.tax, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(viewSale.grandTotal, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-foreground">{viewSale.paymentMethod}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === "sale" && "Void this Invoice?"}
              {deleteType === "payment" && "Delete this Payment?"}
              {deleteType === "quotation" && "Delete this Quotation?"}
              {deleteType === "return" && "Delete this Sales Return?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "sale" && "This will delete the sale record and **automatically return the items to your inventory stock**. This action cannot be undone."}
              {deleteType === "payment" && "This will delete the payment record and **automatically update the customer's balance**. This action cannot be undone."}
              {deleteType === "quotation" && "This will delete the quotation record. This action cannot be undone."}
              {deleteType === "return" && "This will delete the sales return record. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteType === "sale" && "Void Invoice"}
              {deleteType === "payment" && "Delete Payment"}
              {deleteType === "quotation" && "Delete Quotation"}
              {deleteType === "return" && "Delete Return"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Payment Dialog */}
      <Dialog open={!!viewPayment} onOpenChange={() => setViewPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Payment Details</DialogTitle>
          </DialogHeader>
          {viewPayment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <ArrowDownLeft className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="text-xl font-bold text-foreground">#{viewPayment.receiptNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{viewPayment.party?.name || "Cash Sale"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">{format(new Date(viewPayment.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-foreground">{viewPayment.paymentMethod}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Amount</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(viewPayment.amount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              {viewPayment.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-foreground">{viewPayment.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Quotation Dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Quotation Details</DialogTitle>
          </DialogHeader>
          {viewQuotation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <FileCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Number</p>
                  <p className="text-xl font-bold text-foreground">#{viewQuotation.quotationNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{viewQuotation.party?.name || "Cash Sale"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">{format(new Date(viewQuotation.date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    viewQuotation.status === "CONVERTED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    viewQuotation.status === "ACCEPTED" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                    viewQuotation.status === "SENT" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  )}>
                    {viewQuotation.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Items</h4>
                <div className="space-y-2">
                  {viewQuotation.items.map((item: any, idx: number) => (
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
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(viewQuotation.totalAmount, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
                {viewQuotation.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-rose-600">-{formatCurrency(viewQuotation.discount, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                {viewQuotation.tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(viewQuotation.tax, profile?.currency, profile?.currencyPos as any)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(viewQuotation.grandTotal, profile?.currency, profile?.currencyPos as any)}</span>
                </div>
              </div>

              {viewQuotation.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-foreground">{viewQuotation.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Sales Return Dialog */}
      <Dialog open={!!viewReturn} onOpenChange={() => setViewReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Sales Return Details</DialogTitle>
          </DialogHeader>
          {viewReturn && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <RotateCcw className="w-6 h-6 text-rose-600" />
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
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{viewReturn.party?.name || "Cash Sale"}</p>
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
                    viewReturn.status === "REJECTED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
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
                  <span className="text-2xl font-bold text-rose-600">{formatCurrency(viewReturn.refundAmount, profile?.currency, profile?.currencyPos as any)}</span>
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

      {/* Edit Sale Dialog */}
      <Dialog open={!!editSale} onOpenChange={() => setEditSale(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Invoice #{editSale?.invoiceNo}</DialogTitle>
          </DialogHeader>
          {editSale && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Editing this invoice will adjust inventory stock and update customer balance accordingly.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input 
                    type="date" 
                    defaultValue={format(new Date(editSale.date), "yyyy-MM-dd")}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date (Optional)</label>
                  <Input 
                    type="date" 
                    defaultValue={editSale.dueDate ? format(new Date(editSale.dueDate), "yyyy-MM-dd") : ""}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Remarks</label>
                <textarea 
                  defaultValue={editSale.remarks || ""}
                  className="w-full min-h-[80px] px-3 py-2 bg-background border border-border rounded-md"
                  placeholder="Add any notes about this invoice..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditSale(null)}>
                  Cancel
                </Button>
                <Button variant="emerald" onClick={() => {
                  toast.info("Full edit form will be implemented in the next phase");
                  setEditSale(null);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      {paymentDialog && (
        <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice #{paymentDialog.invoiceNo}</p>
                <p className="text-sm text-muted-foreground">Total Amount: {formatCurrency(paymentDialog.grandTotal, profile?.currency, profile?.currencyPos as any)}</p>
                <p className="text-sm text-muted-foreground">Remaining: {formatCurrency(paymentDialog.remainingAmount, profile?.currency, profile?.currencyPos as any)}</p>
              </div>
              <PaymentForm
                sale={paymentDialog}
                onSubmit={handleRecordPayment}
                onCancel={() => setPaymentDialog(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PaymentForm({ sale, onSubmit, onCancel }: { sale: any; onSubmit: (saleId: string, amount: number, paymentMethod: string, remarks: string) => void; onCancel: () => void }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (numAmount > sale.remainingAmount) {
      alert(`Amount cannot exceed remaining balance of ${sale.remainingAmount}`);
      return;
    }
    onSubmit(sale.id, numAmount, paymentMethod, remarks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Payment Amount</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
          max={sale.remainingAmount}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
        >
          <option value="CASH">Cash</option>
          <option value="BANK">Bank Transfer</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Remarks (Optional)</label>
        <Input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Payment description"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Record Payment
        </Button>
      </div>
    </form>
  );
}
