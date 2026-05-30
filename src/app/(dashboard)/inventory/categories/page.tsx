"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ArrowLeft, Tag, Search, FolderOpen, FolderPlus } from "lucide-react";
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
          <Link href="/inventory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your inventory with categories</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[350px_1fr] gap-6">
        {/* ADD FORM */}
        <div className="space-y-4">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Add Category</h3>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category Name</label>
                <Input 
                  placeholder="e.g. Electronics, Grocery..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 font-semibold shadow-lg shadow-emerald-500/20"
                disabled={adding || !newCategory.trim()}
              >
                {adding ? "Adding..." : "Add Category"}
              </Button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-4 shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 p-0 h-10"
            />
          </div>

          {/* Categories Grid */}
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">
                  {search ? "No categories found" : "No categories yet"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {search ? "Try a different search term" : "Create your first category to get started"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-5 hover:bg-accent/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 flex items-center justify-center border border-emerald-500/20">
                        <Tag className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-base">{cat.name}</h4>
                        <p className="text-sm text-muted-foreground">Category</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all h-9 w-9"
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Items linked to this category will remain in inventory but will no longer be categorized.
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
