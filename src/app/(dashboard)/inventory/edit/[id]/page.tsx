"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileStore } from "@/stores/profile-store";
import { getItem, updateItem, getItemCategories } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const { activeProfileId } = useProfileStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (activeProfileId && itemId) {
      Promise.all([
        getItem(activeProfileId, itemId),
        getItemCategories(activeProfileId)
      ]).then(([itemRes, catRes]) => {
        if (itemRes.data) {
          setItem(itemRes.data);
        } else {
          toast.error(itemRes.error || "Item not found");
          router.push("/inventory");
        }
        if (catRes.data) {
          setCategories(catRes.data);
        }
        setLoading(false);
      });
    }
  }, [activeProfileId, itemId, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeProfileId || !itemId) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      purchasePrice: Number(formData.get("purchasePrice")) || 0,
      sellingPrice: Number(formData.get("sellingPrice")) || 0,
      stockQuantity: Number(formData.get("stockQuantity")) || 0,
      unit: formData.get("unit") as string,
      categoryId: formData.get("categoryId") as string === "none" ? undefined : formData.get("categoryId") as string,
    };

    const res = await updateItem(activeProfileId, itemId, data);
    setSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item updated successfully");
      router.push("/inventory");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Item Name <span className="text-destructive">*</span></Label>
            <Input id="name" name="name" required defaultValue={item.name} placeholder="e.g. iPhone 15 Pro" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" defaultValue={item.categoryId || "none"}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">Item Code / SKU</Label>
            <Input id="sku" name="sku" defaultValue={item.sku} placeholder="e.g. IPH15P" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue={item.unit} placeholder="e.g. pcs, kg, box" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price</Label>
            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" defaultValue={item.purchasePrice} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price</Label>
            <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" min="0" defaultValue={item.sellingPrice} placeholder="0.00" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input id="stockQuantity" name="stockQuantity" type="number" min="0" defaultValue={item.stockQuantity} placeholder="0" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button variant="outline" type="button" asChild>
            <Link href="/inventory">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Updating..." : "Update Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
