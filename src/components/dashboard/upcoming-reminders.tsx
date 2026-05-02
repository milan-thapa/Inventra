// src/components/dashboard/upcoming-reminders.tsx
"use client";

import { useState } from "react";
import { Bell, Plus, CreditCard, CheckSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { deleteReminder } from "@/lib/actions/dashboard";

interface Reminder {
  id: string;
  title: string;
  type: string;
  dueDate: Date | string;
  isCompleted: boolean;
}

export function UpcomingReminders({
  reminders: initialReminders,
  profileId,
}: {
  reminders: Reminder[];
  profileId: string;
}) {
  const [reminders, setReminders] = useState(initialReminders);

  const handleDelete = async (id: string) => {
    const res = await deleteReminder(profileId, id);
    if (res.success) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Upcoming Reminders ({reminders.length})
        </h3>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-6">
          <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Reminder Not Created Yet!</p>
          <p className="text-xs text-muted-foreground mb-3">
            Looks like you haven&apos;t created any reminders yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            onClick={() => window.location.href = "/business-tools/reminders"}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add New Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.slice(0, 3).map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                reminder.type === "PAYMENT"
                  ? "bg-rose-500/15 text-rose-500"
                  : "bg-blue-500/15 text-blue-500"
              )}>
                {reminder.type === "PAYMENT"
                  ? <CreditCard className="w-3.5 h-3.5" />
                  : <CheckSquare className="w-3.5 h-3.5" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(new Date(reminder.dueDate))}
                </p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {reminders.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{reminders.length - 3} more reminders
            </p>
          )}
        </div>
      )}
    </div>
  );
}
