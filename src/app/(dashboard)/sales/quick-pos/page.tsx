"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Minus, Trash2, Search, ShoppingCart, 
  CreditCard, Banknote, Package, Sparkles, X, 
  ChevronRight, Calculator, History, Settings, ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileStore } from "@/stores/profile-store";
import { createSale } from "@/lib/actions/sales";
import { getItems, getItemCategories } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Recommendations } from "@/components/sales/recommendations";
import { ThermalReceipt } from "@/components/sales/thermal-receipt";
import { PaymentQRModal } from "@/components/sales/payment-qr-modal";
import { CheckoutSuccessModal } from "@/components/sales/checkout-success-modal";
import { getParties } from "@/lib/actions/party";
import { Smartphone, User, Percent, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickPOSPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  
  const [parties, setParties] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("CASH_CUSTOMER");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("PAID");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  useEffect(() => {
    if (activeProfileId) {
      getItems(activeProfileId).then(res => res.data && setItems(res.data));
      getItemCategories(activeProfileId).then(res => res.data && setCategories(res.data));
      getParties(activeProfileId).then(res => res.data && setParties(res.data));
    }
  }, [activeProfileId]);

  const addToCart = useCallback((item: any) => {
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
      setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart(prev => [{ ...item, quantity: 1 }, ...prev]);
    }
    setSearch("");
    searchInputRef.current?.focus();
  }, [cart]);

  // Barcode / USB Scanner Support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If F1 is pressed, focus search
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // If Enter is pressed and we have a perfect match in SKU
      if (e.key === "Enter" && search.length > 3) {
        const item = items.find(i => i.sku === search);
        if (item) {
          addToCart(item);
          setSearch("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [search, items, addToCart]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "All" || item.category?.name === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

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
      discount: discountAmount,
      tax: taxAmount,
      grandTotal: total,
      partyId: selectedPartyId === "CASH_CUSTOMER" ? undefined : selectedPartyId,
      paymentMethod,
      status: paymentStatus,
      date: new Date(),
    };

    const res = await createSale(activeProfileId!, saleData);
    setLoading(false);

    if (res.error || !res.data) {
      toast.error(res.error || "Failed to complete sale");
    } else {
      setLastSale({ ...res.data, items: cart });
      setSuccessOpen(true);
      setCart([]);
      setQrOpen(false);
      setDiscountPercent(0);
      setTaxPercent(0);
      setSelectedPartyId("CASH_CUSTOMER");
      setPaymentStatus("PAID");
    }
  };

  const resetSale = () => {
    setCart([]);
    setLastSale(null);
    setSuccessOpen(false);
    setDiscountPercent(0);
    setTaxPercent(0);
    setSelectedPartyId("CASH_CUSTOMER");
    setPaymentStatus("PAID");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden -m-4 md:-m-6">
      {/* Thermal Receipt (Hidden, only for print) */}
      {lastSale && (
        <ThermalReceipt 
          businessName={profile?.name || "Inventra POS"}
          address={profile?.address || undefined}
          invoiceNo={lastSale.invoiceNo.toString()}
          date={lastSale.date}
          items={lastSale.items}
          subtotal={lastSale.totalAmount}
          tax={lastSale.tax}
          discount={lastSale.discount}
          total={lastSale.grandTotal}
          currency={profile?.currency}
        />
      )}

      <PaymentQRModal 
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onConfirm={handleCheckout}
        amount={total}
        currency={profile?.currency}
        businessName={profile?.name || "Inventra POS"}
      />

      <CheckoutSuccessModal 
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        onNewSale={resetSale}
        onPrint={handlePrint}
        saleData={lastSale}
        currency={profile?.currency}
      />

      <div className="flex-1 flex overflow-hidden bg-secondary/5">
        {/* ── LEFT: PRODUCT GRID ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Terminal Info & Search */}
          <div className="px-6 py-4 flex flex-col gap-4 bg-background border-b shadow-sm relative z-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold">Quick POS Terminal</h2>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Active Session: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {lastSale && (
                      <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-emerald-500 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white">
                        <History className="w-3.5 h-3.5 mr-1.5" /> Print Last Bill (#{lastSale.invoiceNo})
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-border/50">
                        <History className="w-3.5 h-3.5 mr-1.5" /> History
                    </Button>
                </div>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                ref={searchInputRef}
                placeholder="Search products or scan (F1)..." 
                className="pl-12 h-12 text-base bg-secondary/30 border-none focus-visible:ring-emerald-500 rounded-xl transition-all"
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
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border-2",
                  activeCategory === "All" 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : "bg-card border-border/50 text-muted-foreground hover:border-emerald-500/50"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border-2",
                    activeCategory === cat.name 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-card border-border/50 text-muted-foreground hover:border-emerald-500/50"
                  )}
                >
                  {cat.name}
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={item.stockQuantity <= 0}
                    className={cn(
                        "group relative flex flex-col bg-card border border-border/50 rounded-xl overflow-hidden hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/5 transition-all text-left",
                        item.stockQuantity <= 0 && "opacity-60 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="aspect-[4/3] bg-secondary/20 flex items-center justify-center relative overflow-hidden">
                        <Package className={cn(
                            "w-8 h-8 transition-transform duration-500 group-hover:scale-110",
                            item.stockQuantity > 0 ? "text-emerald-500/30" : "text-muted-foreground/30"
                        )} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-xs leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{item.name}</h4>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-sm font-black text-foreground">
                            {formatCurrency(item.sellingPrice, profile?.currency)}
                        </span>
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
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
        <div className="w-[380px] bg-card border-l flex flex-col shadow-xl relative z-20">
          <div className="p-4 border-b space-y-3 bg-secondary/5">
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Customer / Party</label>
                <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                    <SelectTrigger className="h-10 bg-background border-none shadow-sm focus:ring-emerald-500 rounded-xl">
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            <SelectValue placeholder="Select Customer" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CASH_CUSTOMER">Cash Customer (Default)</SelectItem>
                        {parties.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Payment Status</label>
                <div className="flex p-1 bg-background rounded-xl border border-border/50 shadow-sm">
                    <button 
                        onClick={() => setPaymentStatus("PAID")}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            paymentStatus === "PAID" ? "bg-emerald-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        Paid
                    </button>
                    <button 
                        onClick={() => setPaymentStatus("UNPAID")}
                        disabled={selectedPartyId === "CASH_CUSTOMER"}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            paymentStatus === "UNPAID" ? "bg-rose-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary/50",
                            selectedPartyId === "CASH_CUSTOMER" && "opacity-30 cursor-not-allowed grayscale"
                        )}
                    >
                        Credit
                    </button>
                </div>
                {selectedPartyId === "CASH_CUSTOMER" && (
                    <p className="text-[8px] text-muted-foreground italic px-1">* Credit only available for registered Parties</p>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id} 
                  className="flex flex-col bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-bold leading-tight line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(item.sellingPrice, profile?.currency)}</p>
                    </div>
                    <span className="font-bold text-foreground text-xs">
                        {formatCurrency(item.quantity * Number(item.sellingPrice), profile?.currency)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded-lg">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-md hover:bg-white" 
                            onClick={() => updateQuantity(item.id, -1)}
                        >
                            <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <span className="w-6 text-center text-[10px] font-black">{item.quantity}</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-md hover:bg-white" 
                            onClick={() => updateQuantity(item.id, 1)}
                        >
                            <Plus className="w-2.5 h-2.5" />
                        </Button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-bold text-rose-500 hover:underline">
                        Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Recommendations 
              profileId={activeProfileId!}
              cartItemIds={cart.map(i => i.id)}
              onAdd={addToCart}
              currency={profile?.currency}
            />
          </div>

          <div className="p-6 bg-card border-t-2 border-border/30 space-y-5">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, profile?.currency)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/40">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 px-1">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Discount %</span>
                        </div>
                        <Input 
                            type="number" 
                            value={discountPercent || ""} 
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            placeholder="0"
                            className="h-8 bg-secondary/30 border-none focus-visible:ring-emerald-500 text-xs font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 px-1">
                            <Percent className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax %</span>
                        </div>
                        <Input 
                            type="number" 
                            value={taxPercent || ""} 
                            onChange={(e) => setTaxPercent(Number(e.target.value))}
                            placeholder="0"
                            className="h-8 bg-secondary/30 border-none focus-visible:ring-emerald-500 text-xs font-bold"
                        />
                    </div>
                </div>
                
                {(discountAmount > 0 || taxAmount > 0) && (
                    <div className="space-y-1.5 pt-1">
                        {discountAmount > 0 && (
                            <div className="flex items-center justify-between text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                <span>Discount Applied</span>
                                <span>-{formatCurrency(discountAmount, profile?.currency)}</span>
                            </div>
                        )}
                        {taxAmount > 0 && (
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                <span>Tax Applied</span>
                                <span>+{formatCurrency(taxAmount, profile?.currency)}</span>
                            </div>
                        )}
                    </div>
                )}
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
                onClick={() => setQrOpen(true)}
                variant="outline"
                className="h-16 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex flex-col gap-0 active:scale-95 transition-transform"
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-[10px] uppercase font-black tracking-widest">QR Payment</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
