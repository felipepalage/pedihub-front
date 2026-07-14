import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api";
import { statusLabels } from "@/lib/domain";

const styles: Record<OrderStatus, string> = {
  aguardando_pagamento: "bg-yellow-500/10 text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700",
  pago: "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700",
  novo: "bg-info/10 text-info border-info/20",
  aceito: "bg-warning/15 text-warning border-warning/20",
  preparando: "bg-orange/15 text-orange border-orange/20",
  saiu_entrega: "bg-purple/15 text-purple border-purple/20",
  pronto_retirada: "bg-success/15 text-success border-success/20",
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
