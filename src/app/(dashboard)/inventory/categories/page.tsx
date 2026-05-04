"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ArrowLeft, Tag, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useProfileStore } from "@/stores/profile-store";
import { getItemCategories, createItemCategory, deleteItemCategory } from "@/lib/actions/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

export default function CategoriesPage() {
  const { activeProfileId } = useProfileStore();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadCategories = useCallback(async () => {
    if (!activeProfileId) return;
    setLoading(true);
    const res = await getItemCategories(activeProfileId);
    if (res.data) setCategories(res.data);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId || !newCategory.trim()) return;

    setAdding(true);
    const res = await createItemCategory(activeProfileId, newCategory.trim());
    setAdding(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Category added successfully");
      setNewCategory("");
      loadCategories();
    }
  };

  const handleDelete = async () => {
    if (!activeProfileId || !deleteId) return;
    
    const res = await deleteItemCategory(activeProfileId, deleteId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Category deleted successfully");
      loadCategories();
    }
    setDeleteId(null);
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/inventory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manage Categories</h1>
          <p className="text-sm text-muted-foreground">Create and manage your inventory categories</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        {/* ADD FORM */}
        <div className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Add New Category
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="e.g. Grocery, Electronics..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-secondary/30 border-none focus-visible:ring-emerald-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={adding || !newCategory.trim()}
              >
                {adding ? "Adding..." : "Add Category"}
              </Button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-2 pl-4 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 p-0"
            />
          </div>

          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Tag className="w-10 h-10 opacity-20" />
                <p>{search ? "No matches found" : "No categories created yet"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg"
                      onClick={() => setDeleteId(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category. Items linked to this category will remain in inventory but will no longer be categorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
