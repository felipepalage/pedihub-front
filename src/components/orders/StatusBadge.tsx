import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api";
import { statusLabels } from "@/lib/domain";

const styles: Record<OrderStatus, string> = {
  novo: "bg-info/10 text-info border-info/20",
  aceito: "bg-warning/15 text-warning border-warning/20",
  preparando: "bg-orange/15 text-orange border-orange/20",
  saiu_entrega: "bg-purple/15 text-purple border-purple/20",
  finalizado: "bg-success/10 text-success border-success/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}
