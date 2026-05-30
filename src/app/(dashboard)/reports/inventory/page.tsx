"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Calendar, TrendingUp, Package, AlertTriangle, Box, DollarSign, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileStore } from "@/stores/profile-store";
import { getInventoryReports } from "@/lib/actions/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

export default function InventoryReportPage() {
  const router = useRouter();
  const { activeProfileId } = useProfileStore();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReports = async () => {
    if (!activeProfileId) return;
    setLoading(true);
    const res = await getInventoryReports(activeProfileId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    if (res.data) {
      setReports(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  const handleFilter = () => {
    loadReports();
  };

  const handleExport = () => {
    if (!reports) return;
    
    // Create CSV content
    const headers = ["Category", "Item Count", "Total Stock", "Total Value"];
    const rows = reports.categoryAnalysis.map((cat: any) => [
      cat.name,
      String(cat.itemCount),
      String(cat.totalStock),
      cat.totalValue.toFixed(2)
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Inventory Report</h1>
        </div>
        <Button
          onClick={handleExport}
          disabled={loading || !reports}
          className="h-9 text-xs gap-2"
          variant="outline"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Date Filter */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-40 text-sm"
            />
            <span className="text-gray-400">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-40 text-sm"
            />
            <Button
              onClick={handleFilter}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Apply Filter
            </Button>
            <Button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                loadReports();
              }}
              variant="outline"
              className="h-9 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : reports ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Items</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.summary.totalItems}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Stock</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.summary.totalStock}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Value</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(reports.summary.totalValue)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Low Stock</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.summary.lowStockCount}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Out of Stock</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.summary.outOfStockCount}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Stock Added</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.summary.stockAdded}
                </p>
              </div>
            </div>

            {/* Category Analysis */}
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category Analysis</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:border-gray-800">
                {reports.categoryAnalysis.map((cat: any, idx: number) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cat.itemCount} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{cat.totalStock} units</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(cat.totalValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Items */}
            {reports.lowStockItems.length > 0 && (
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Items</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:border-gray-800">
                  {reports.lowStockItems.map((item: any) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.category?.name || "General"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">{item.stockQuantity} / {item.reorderPoint}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.unit || "PCS"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Out of Stock Items */}
            {reports.outOfStockItems.length > 0 && (
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Out of Stock Items</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:border-gray-800">
                  {reports.outOfStockItems.map((item: any) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.category?.name || "General"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">0 units</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.unit || "PCS"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Movements */}
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Stock Movements</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:border-gray-800">
                {reports.movements.map((movement: any) => (
                  <div key={movement.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <div>
                      <p className={cn(
                        "font-medium",
                        movement.type === "ADD" ? "text-emerald-600" : "text-red-600"
                      )}>
                        {movement.type === "ADD" ? "Stock Added" : "Stock Reduced"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{movement.reason || "No reason"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {movement.type === "ADD" ? "+" : "-"}{movement.quantity}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
