"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Minus, Trash2, Search, ShoppingCart, 
  CreditCard, Banknote, Package, Sparkles, X, 
  ChevronRight, Calculator, History, Settings
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileStore } from "@/stores/profile-store";
import { createSale } from "@/lib/actions/sales";
import { getItems } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickPOSPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeProfileId) {
      getItems(activeProfileId).then(res => res.data && setItems(res.data));
    }
  }, [activeProfileId]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const addToCart = (item: any) => {
    if (item.stockQuantity <= 0) {
        toast.error(`Out of stock: ${item.name}`);
        return;
    }
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stockQuantity) {
        toast.warning("Cannot add more than available stock");
        return;
      }
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([{ ...item, quantity: 1 }, ...cart]);
    }
    setSearch("");
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.id === id) {
        const itemInStock = items.find(orig => orig.id === id);
        const newQty = Math.max(1, i.quantity + delta);
        if (delta > 0 && itemInStock && newQty > itemInStock.stockQuantity) {
            toast.warning("Exceeds available stock");
            return i;
        }
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * Number(item.sellingPrice)), 0);
  const total = subtotal;

  const handleCheckout = async (paymentMethod: "CASH" | "BANK") => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    const saleData = {
      items: cart.map(i => ({
        itemId: i.id,
        name: i.name,
        quantity: i.quantity,
        rate: Number(i.sellingPrice),
        amount: i.quantity * Number(i.sellingPrice)
      })),
      totalAmount: subtotal,
      discount: 0,
      tax: 0,
      grandTotal: total,
      paymentMethod,
      status: "PAID",
      date: new Date(),
    };

    const res = await createSale(activeProfileId!, saleData);
    setLoading(false);

    if (res.error || !res.data) {
      toast.error(res.error || "Failed to complete sale");
    } else {
      toast.success(`POS Sale Completed! Invoice #${res.data.invoiceNo}`, {
        description: `Total Amount: ${formatCurrency(total, profile?.currency, profile?.currencyPos as any)}`,
        icon: <Sparkles className="w-4 h-4 text-emerald-500" />
      });
      setCart([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* ── TOP TERMINAL BAR ──────────────────────────────── */}
      <div className="h-16 border-b bg-card px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">INVENTRA <span className="text-emerald-500 text-xs font-mono ml-2 border border-emerald-500/30 px-1.5 py-0.5 rounded">v2.0 POS</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">{profile?.name || "Terminal 01"}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end px-4 py-1 border-x border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Session Time</span>
                <span className="text-xs font-mono">00:42:15</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><History className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><Calculator className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><Settings className="w-4 h-4" /></Button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-secondary/20">
        {/* ── LEFT: PRODUCT GRID ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Category & Search Header */}
          <div className="p-4 flex flex-col gap-4 bg-background/50 backdrop-blur-md border-b">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                ref={searchInputRef}
                placeholder="Search products or scan barcode (F1)..." 
                className="pl-12 h-14 text-lg bg-background border-2 border-border/50 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-2xl shadow-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["All", "Recent", "Electronics", "FMCG", "Services"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border-2",
                    activeCategory === cat 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-card border-border/50 text-muted-foreground hover:border-emerald-500/50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={item.stockQuantity <= 0}
                    className={cn(
                        "group relative flex flex-col bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-emerald-500 transition-all text-left shadow-sm",
                        item.stockQuantity <= 0 && "opacity-60 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="aspect-square bg-secondary/30 flex items-center justify-center p-6 relative">
                        <Package className={cn(
                            "w-10 h-10 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12",
                            item.stockQuantity > 0 ? "text-emerald-500/40" : "text-muted-foreground/40"
                        )} />
                        {item.stockQuantity <= 5 && item.stockQuantity > 0 && (
                            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                Low Stock
                            </div>
                        )}
                        {item.stockQuantity <= 0 && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-lg">Sold Out</span>
                             </div>
                        )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-bold text-sm leading-tight mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mb-3 font-mono">{item.sku || "N/A"}</p>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
                        <span className="text-sm font-black text-foreground">
                            {formatCurrency(item.sellingPrice, profile?.currency, profile?.currencyPos as any)}
                        </span>
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── RIGHT: RECEIPT PANEL ─────────────────────────── */}
        <div className="w-[400px] bg-card border-l flex flex-col shadow-2xl relative z-20">
          <div className="p-6 border-b flex items-center justify-between bg-emerald-600 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-sm uppercase tracking-tighter">Shopping Cart</h2>
                <p className="text-[10px] opacity-70 font-bold uppercase">{cart.length} Products Added</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setCart([])}>
                <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  layout
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  key={item.id} 
                  className="flex flex-col bg-background border-2 border-border/50 rounded-2xl p-4 shadow-sm hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold leading-tight">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item.sellingPrice, profile?.currency)} per unit</p>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">
                        {formatCurrency(item.quantity * Number(item.sellingPrice), profile?.currency)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm" 
                            onClick={() => updateQuantity(item.id, -1)}
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm" 
                            onClick={() => updateQuantity(item.id, 1)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => removeFromCart(item.id)}>
                        <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-inner border border-border/20">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Waiting for products...</h3>
                <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-[180px]">Please select items from the product grid to start the checkout process.</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-card border-t-2 border-border/30 space-y-5">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, profile?.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Tax (0%)</span>
                    <span>{formatCurrency(0, profile?.currency)}</span>
                </div>
            </div>

            <div className="p-5 bg-secondary/30 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Total Payable Amount</span>
                <span className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">
                    {formatCurrency(total, profile?.currency, profile?.currencyPos as any)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                disabled={loading || cart.length === 0} 
                onClick={() => handleCheckout("CASH")}
                className="h-16 bg-emerald-600 hover:bg-emerald-700 flex flex-col gap-0 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
              >
                <Banknote className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-black tracking-widest">Pay in Cash</span>
              </Button>
              <Button 
                disabled={loading || cart.length === 0} 
                onClick={() => handleCheckout("BANK")}
                variant="outline"
                className="h-16 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex flex-col gap-0 active:scale-95 transition-transform"
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-black tracking-widest">Bank Transfer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
