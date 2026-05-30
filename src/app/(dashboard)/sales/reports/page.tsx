"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { getSales } from "@/lib/actions/sales";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Coins, ShoppingCart, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesReportsPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  const loadSales = useCallback(async () => {
    setLoading(true);
    const res = await getSales(activeProfileId!);
    if (res.data) setSales(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadSales();
    }
  }, [activeProfileId, loadSales]);

  const getFilteredSales = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "quarter":
        startDate = subMonths(now, 3);
        break;
      case "year":
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    return sales.filter(sale => new Date(sale.date) >= startDate);
  };

  const filteredSales = getFilteredSales();

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const paidSales = filteredSales.filter(s => s.status === "PAID");
  const paidRevenue = paidSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  const topItems = filteredSales.reduce((acc: any, sale) => {
    sale.items.forEach((item: any) => {
      const existing = acc.find((i: any) => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.amount += item.amount;
      } else {
        acc.push({ name: item.name, quantity: item.quantity, amount: item.amount });
      }
    });
    return acc;
  }, []).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5);

  const topCustomers = filteredSales.reduce((acc: any, sale) => {
    if (sale.party) {
      const existing = acc.find((c: any) => c.id === sale.party.id);
      if (existing) {
        existing.amount += sale.grandTotal;
        existing.count += 1;
      } else {
        acc.push({ id: sale.party.id, name: sale.party.name, amount: sale.grandTotal, count: 1 });
      }
    }
    return acc;
  }, []).sort((a: any, b: any) => b.amount - a.amount).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze your sales performance</p>
        </div>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue, profile?.currency)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredSales.length} invoices
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Paid Revenue</p>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(paidRevenue, profile?.currency)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {paidSales.length} paid invoices
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Pending Revenue</p>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingRevenue, profile?.currency)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredSales.length - paidSales.length} pending
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Average Order</p>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {filteredSales.length > 0 ? formatCurrency(totalRevenue / filteredSales.length, profile?.currency) : formatCurrency(0, profile?.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per invoice
          </p>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-card border border-border/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Selling Items
        </h3>
        {topItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No sales data available</p>
        ) : (
          <div className="space-y-4">
            {topItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.amount, profile?.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Customers */}
      <div className="bg-card border border-border/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top Customers
        </h3>
        {topCustomers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No customer data available</p>
        ) : (
          <div className="space-y-4">
            {topCustomers.map((customer: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.count} orders</p>
                </div>
                <p className="font-semibold">{formatCurrency(customer.amount, profile?.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
