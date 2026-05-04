// src/components/shared/empty-state.tsx
"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {/* Illustration circle */}
      <div className="w-20 h-20 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
        <Icon className="w-9 h-9 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button
          size="sm"
          onClick={action.onClick}
          className="btn-income h-8 px-3 text-xs gap-1.5 mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
