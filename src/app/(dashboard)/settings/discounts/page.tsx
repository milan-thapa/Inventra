"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit, Percent, DollarSign, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useProfileStore } from "@/stores/profile-store";
import { format } from "date-fns";

export default function DiscountsPage() {
  const { activeProfileId, profiles } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/discounts?profileId=${activeProfileId}`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts || []);
      }
    } catch (error) {
      console.error("Failed to load discounts:", error);
    }
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      loadDiscounts();
    }
  }, [activeProfileId, loadDiscounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId) return;

    try {
      const url = editingDiscount 
        ? `/api/discounts/${editingDiscount.id}`
        : "/api/discounts";
      
      const method = editingDiscount ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          profileId: activeProfileId,
        }),
      });

      if (response.ok) {
        toast.success(editingDiscount ? "Discount updated successfully" : "Discount created successfully");
        setDialogOpen(false);
        setEditingDiscount(null);
        resetForm();
        loadDiscounts();
      } else {
        toast.error("Failed to save discount");
      }
    } catch (error) {
      toast.error("Failed to save discount");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !activeProfileId) return;

    try {
      const response = await fetch(`/api/discounts/${deleteId}?profileId=${activeProfileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Discount deleted successfully");
        setDeleteId(null);
        loadDiscounts();
      } else {
        toast.error("Failed to delete discount");
      }
    } catch (error) {
      toast.error("Failed to delete discount");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "PERCENTAGE",
      value: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  const openDialog = (discount?: any) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        name: discount.name,
        type: discount.type,
        value: discount.value.toString(),
        startDate: discount.startDate ? format(new Date(discount.startDate), "yyyy-MM-dd") : "",
        endDate: discount.endDate ? format(new Date(discount.endDate), "yyyy-MM-dd") : "",
        isActive: discount.isActive,
      });
    } else {
      setEditingDiscount(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discount Management</h1>
          <p className="text-muted-foreground">Create and manage discounts for your sales</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Create Discount
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-5 h-40" />
          ))}
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12">
          <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No discounts found</p>
          <p className="text-sm text-muted-foreground mb-6">Create discounts to offer special pricing to your customers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 flex items-center justify-center border border-purple-500/20">
                    {discount.type === "PERCENTAGE" ? (
                      <Percent className="w-5 h-5 text-purple-600" />
                    ) : (
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{discount.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {discount.type === "PERCENTAGE" ? `${discount.value}% off` : `${discount.value} off`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {discount.isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>

              {discount.startDate && (
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {format(new Date(discount.startDate), "dd MMM yyyy")}
                  </span>
                  {discount.endDate && <span className="text-muted-foreground">•</span>}
                  {discount.endDate && (
                    <span className="text-sm text-foreground">
                      {format(new Date(discount.endDate), "dd MMM yyyy")}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDialog(discount)}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(discount.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? "Edit Discount" : "Create Discount"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Discount Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter discount name"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Discount Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value">
                {formData.type === "PERCENTAGE" ? "Percentage (%)" : "Amount"}
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === "PERCENTAGE" ? "Enter percentage" : "Enter amount"}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDiscount ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount? This action cannot be undone.
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
