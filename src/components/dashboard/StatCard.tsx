import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info" | "destructive";
}

const accents = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({
  label,
  value,
  delta,
  trend = "neutral",
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accents[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
