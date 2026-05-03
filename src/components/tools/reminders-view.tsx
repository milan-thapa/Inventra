// src/components/tools/reminders-view.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, Pencil, Trash2, X, Loader2,
  CreditCard, CheckSquare, Calendar, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createReminder, deleteReminder, toggleReminder, markReminderCompleted } from "@/lib/actions/dashboard";
import { formatDate, cn } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  type: string;
  dueDate: Date | string;
  isCompleted: boolean;
}

export function RemindersView({
  upcomingReminders: initialUpcoming,
  completedReminders: initialCompleted,
  profileId,
}: {
  upcomingReminders: Reminder[];
  completedReminders: Reminder[];
  profileId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [completed, setCompleted] = useState(initialCompleted);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "TASK",
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
  });

  const current = tab === "upcoming" ? upcoming : completed;
  const filtered = current.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  // Real-time auto-completion check
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const pastDue = upcoming.filter(r => new Date(r.dueDate) <= now);
      
      if (pastDue.length > 0) {
        setUpcoming(prev => prev.filter(r => new Date(r.dueDate) > now));
        
        setCompleted(prev => {
          const newCompleted = pastDue.map(p => ({ ...p, isCompleted: true }));
          const combined = [...newCompleted, ...prev];
          
          // Ensure no duplicates by ID
          const uniqueMap = new Map();
          combined.forEach(item => uniqueMap.set(item.id, item));
          
          return Array.from(uniqueMap.values()).sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
        });
        
        pastDue.forEach(r => markReminderCompleted(profileId, r.id));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [upcoming, profileId]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setLoading(true);

    const dueDate = new Date(`${form.date}T${form.time}`);
    const res = await createReminder(profileId, {
      title: form.title,
      type: form.type,
      dueDate,
    });

    setLoading(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      if (res.data) setUpcoming((prev) => [res.data!, ...prev]);
      setAddOpen(false);
      setForm({ title: "", type: "TASK", date: new Date().toISOString().split("T")[0], time: "12:00" });
      toast({ title: "Reminder created" });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteReminder(profileId, id);
    if (res.success) {
      setUpcoming((prev) => prev.filter((r) => r.id !== id));
      setCompleted((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Reminder deleted" });
    }
  };

  const handleToggle = async (id: string, isCurrentlyCompleted: boolean) => {
    const reminderToMove = current.find(r => r.id === id);
    if (!reminderToMove) return;

    // Optimistic update
    if (isCurrentlyCompleted) {
      setCompleted(prev => prev.filter(r => r.id !== id));
      setUpcoming(prev => [{ ...reminderToMove, isCompleted: false }, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    } else {
      setUpcoming(prev => prev.filter(r => r.id !== id));
      setCompleted(prev => [{ ...reminderToMove, isCompleted: true }, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }

    const res = await toggleReminder(profileId, id);
    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
      // Revert if error
      if (isCurrentlyCompleted) {
        setUpcoming(prev => prev.filter(r => r.id !== id));
        setCompleted(prev => [{ ...reminderToMove, isCompleted: true }, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      } else {
        setCompleted(prev => prev.filter(r => r.id !== id));
        setUpcoming(prev => [{ ...reminderToMove, isCompleted: false }, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      }
    } else {
      toast({ title: isCurrentlyCompleted ? "Marked as incomplete" : "Marked as completed" });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Reminders</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}
          className="btn-income h-8 px-3 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add New Reminder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border/50 mb-4">
        {[
          { value: "upcoming",  label: `Upcoming (${upcoming.length})` },
          { value: "completed", label: `Completed (${completed.length})` },
        ].map((t) => (
          <button key={t.value} onClick={() => setTab(t.value as "upcoming" | "completed")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.value
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-64">
        <Input placeholder="Search reminder..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-muted/30 border-border/50" />
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {tab === "upcoming" ? "No any upcoming reminders" : "No completed reminders"}
            </p>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left">Type</th>
                <th className="text-left">Title</th>
                <th className="text-left">Date</th>
                <th className="text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reminder) => (
                <tr key={reminder.id}>
                  <td>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      reminder.type === "PAYMENT"
                        ? "bg-rose-500/15 text-rose-500"
                        : "bg-blue-500/15 text-blue-500"
                    )}>
                      {reminder.type === "PAYMENT"
                        ? <CreditCard className="w-3.5 h-3.5" />
                        : <CheckSquare className="w-3.5 h-3.5" />
                      }
                    </div>
                  </td>
                  <td>
                    <p className="text-sm font-medium text-foreground">
                      {reminder.type === "PAYMENT" ? "Payment Reminder" : "Task Reminder"}
                    </p>
                    <p className="text-xs text-muted-foreground">{reminder.title}</p>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {formatDate(new Date(reminder.dueDate), "dd MMM yyyy · hh:mm aa")}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleToggle(reminder.id, reminder.isCompleted)}
                        title={reminder.isCompleted ? "Mark as incomplete" : "Mark as completed"}
                        className={cn(
                          "p-1.5 rounded hover:bg-accent transition-colors",
                          reminder.isCompleted ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(reminder.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Reminder Modal */}
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
                  <h2 className="font-bold text-foreground">Add New Reminder</h2>
                  <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Reminder Title</Label>
                    <Input
                      placeholder="eg. Collect payment from ram"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-9 text-sm bg-muted/50 border-border/50"
                    />
                  </div>

                  {/* Date + Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Select Date</Label>
                      <div className="relative">
                        <Input type="date" value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="h-9 text-sm bg-muted/50 border-border/50" />
                        <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Select Time</Label>
                      <div className="relative">
                        <Input type="time" value={form.time}
                          onChange={(e) => setForm({ ...form, time: e.target.value })}
                          className="h-9 text-sm bg-muted/50 border-border/50" />
                        <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Reminder Type</Label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
                    >
                      <option value="TASK">Task Reminder</option>
                      <option value="PAYMENT">Payment Reminder</option>
                    </select>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" className="flex-1 h-10 border-border/50"
                      onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={handleCreate} disabled={loading || !form.title.trim()}>
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Save
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
