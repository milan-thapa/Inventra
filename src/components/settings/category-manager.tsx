// src/components/settings/category-manager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  createExpenseCategory, deleteExpenseCategory,
  createIncomeCategory,
} from "@/lib/actions/expense";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  totalAmount: number;
}

export function CategoryManager({
  title,
  initialCategories,
  profileId,
  type,
}: {
  title: string;
  initialCategories: Category[];
  profileId: string;
  type: "expense" | "income";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);

    const res = type === "expense"
      ? await createExpenseCategory(profileId, newName.trim())
      : await createIncomeCategory(profileId, newName.trim());

    setLoading(false);

    if ("error" in res && res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      if (res.data) {
        setCategories((prev) => [...prev, { id: res.data!.id, name: res.data!.name, totalAmount: 0 }]);
      }
      setNewName("");
      setAdding(false);
      toast({ title: "Category added" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Expenses using it will lose their category.")) return;

    const res = await deleteExpenseCategory(profileId, id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category deleted" });
    } else {
      toast({ variant: "destructive", title: res.error ?? "Failed to delete" });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}
          className="btn-income h-8 px-3 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add New Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Input placeholder="Search Category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-muted/30 border-border/50" />
      </div>

      {/* Add new form (inline) */}
      {adding && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <Input
            autoFocus
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            className="h-8 text-sm bg-background border-border/50 flex-1"
          />
          <button onClick={handleAdd} disabled={loading || !newName.trim()}
            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setAdding(false); setNewName(""); }}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left">Category Name</th>
              <th className="text-right">Total Amount</th>
              <th className="text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                  {search ? "No categories match your search" : "No categories yet"}
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <Input autoFocus value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm bg-muted/50 border-border/50 w-40" />
                        <button onClick={() => setEditingId(null)}
                          className="p-1 rounded hover:bg-accent text-muted-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    )}
                  </td>
                  <td className="text-right text-sm text-muted-foreground">
                    {cat.totalAmount > 0
                      ? <span className={type === "expense" ? "text-rose-400" : "text-emerald-400"}>{formatCurrency(cat.totalAmount)}</span>
                      : "Rs. 0"
                    }
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
