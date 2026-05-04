// src/components/accounts/accounts-view.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Building2, Banknote, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createAccount } from "@/lib/actions/dashboard";
import { formatCurrency, cn } from "@/lib/utils";

interface Account {
  id: string;
  type: string;
  bankName: string | null;
  holderName: string | null;
  accountNumber: string | null;
  currentBalance: number | string;
}

const ACCOUNT_TYPES = [
  "Bank Account",
  "Mobile Banking",
  "Digital Wallet",
  "Cash",
  "Other",
];

export function AccountsView({
  initialAccounts,
  initialTotal,
  profileId,
}: {
  initialAccounts: Account[];
  initialTotal: number;
  profileId: string;
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [totalBalance, setTotalBalance] = useState(initialTotal);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "Bank Account",
    bankName: "",
    holderName: "",
    accountNumber: "",
    currentBalance: "",
  });

  const handleCreate = async () => {
    setLoading(true);
    const res = await createAccount(profileId, {
      type: form.type,
      bankName: form.bankName || undefined,
      holderName: form.holderName || undefined,
      accountNumber: form.accountNumber || undefined,
      currentBalance: parseFloat(form.currentBalance) || 0,
    });
    setLoading(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Account added successfully" });
      if (res.data) {
        const newAccount = {
          ...res.data,
          currentBalance: Number(res.data.currentBalance),
        };
        setAccounts((prev) => [...prev, newAccount]);
        setTotalBalance((prev) => prev + (parseFloat(form.currentBalance) || 0));
      }
      setAddOpen(false);
      setForm({ type: "Bank Account", bankName: "", holderName: "", accountNumber: "", currentBalance: "" });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">
          Manage Accounts ({accounts.length})
        </h1>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          className="btn-income h-8 px-3 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Account
        </Button>
      </div>

      {/* Total Balance */}
      <div className="bg-card rounded-xl border border-border/50 p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border/50 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center">
                {account.type === "Cash"
                  ? <Banknote className="w-5 h-5 text-emerald-500" />
                  : <Building2 className="w-5 h-5 text-emerald-500" />
                }
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {account.bankName ?? account.type}
                </p>
                <p className="text-xs text-muted-foreground">{account.type}</p>
              </div>
            </div>
            {account.holderName && (
              <p className="text-xs text-muted-foreground mb-1">{account.holderName}</p>
            )}
            {account.accountNumber && (
              <p className="text-xs text-muted-foreground mb-2 font-mono">
                ****{account.accountNumber.slice(-4)}
              </p>
            )}
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(Number(account.currentBalance))}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setAddOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-bold text-foreground">Add New Account</h2>
                  <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Account Type */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Account Type</Label>
                    <div className="relative">
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none pr-8"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Bank Name</Label>
                    <Input placeholder="Enter name"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>

                  {/* Holder Name */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Account Holder Name</Label>
                    <Input placeholder="Enter account holder name"
                      value={form.holderName}
                      onChange={(e) => setForm({ ...form, holderName: e.target.value })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>

                  {/* Account Number */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Account Number</Label>
                    <Input placeholder="Enter account number"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      className="h-9 text-sm bg-muted/50 border-border/50" />
                  </div>

                  {/* Current Balance */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Current Account Balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                      <Input placeholder="0.00" type="number"
                        value={form.currentBalance}
                        onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
                        className="h-9 text-sm bg-muted/50 border-border/50 pl-10" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1 h-10 border-border/50"
                      onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={handleCreate} disabled={loading}>
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Add Account
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
