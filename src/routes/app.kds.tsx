import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChefHat, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { getOrders, advanceOrder, type OrderListItem } from "@/lib/api";
import { channelLabels } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/kds")({
  component: KDSPage,
});

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseTimeToMs(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 1);
  return d.getTime();
}

function ElapsedBadge({ time }: { time: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor((now - parseTimeToMs(time)) / 60000);
  const label = mins < 1 ? "< 1 min" : `${mins} min`;
  const urgent = mins >= 20;
  const warning = mins >= 10;

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
      urgent ? "bg-destructive/15 text-destructive" :
      warning ? "bg-warning/15 text-warning" :
      "bg-muted text-muted-foreground"
    )}>
      {label}
    </span>
  );
}

const STATUS_COLS = [
  {
    id: "novo_pago",
    label: "Novos / PIX Pago",
    statuses: ["novo", "pago"] as string[],
    dot: "bg-orange-500",
    border: "border-orange-300 dark:border-orange-700",
    header: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  {
    id: "aceito",
    label: "Aceitos",
    statuses: ["aceito"] as string[],
    dot: "bg-blue-500",
    border: "border-blue-300 dark:border-blue-700",
    header: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  {
    id: "preparando",
    label: "Em Preparo",
    statuses: ["preparando"] as string[],
    dot: "bg-amber-500",
    border: "border-amber-300 dark:border-amber-700",
    header: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
];

function KDSPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const raw = await getOrders({ filter: "todos" });
      const all: OrderListItem[] = Array.isArray(raw) ? raw : (raw as any)?.items ?? [];
      setOrders(all.filter((o) => ["novo", "pago", "aceito", "preparando"].includes(o.status)));
      setLastRefresh(Date.now());
    } catch {}
    finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async (id: string, number: number) => {
    try {
      await advanceOrder(id);
      toast.success(`Pedido #${number} avancado!`);
      load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao avancar pedido.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const colMap = STATUS_COLS.map((col) => ({
    ...col,
    orders: orders.filter((o) => col.statuses.includes(o.status)),
  }));

  return (
    <div ref={containerRef} className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cozinha (KDS)</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""} ativo{orders.length !== 1 ? "s" : ""} · atualiza a cada 15s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {new Date(lastRefresh).toLocaleTimeString("pt-BR")}
          </span>
          <Button variant="outline" size="icon" onClick={() => load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Carregando pedidos...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {colMap.map((col) => (
            <div key={col.id} className={cn("overflow-hidden rounded-2xl border-2", col.border)}>
              <div className={cn("flex items-center justify-between px-4 py-3", col.header)}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                  <span className={cn("text-sm font-bold", col.text)}>{col.label}</span>
                </div>
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white",
                  col.dot
                )}>
                  {col.orders.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 bg-card p-2 max-h-[calc(100vh-280px)] min-h-[180px] overflow-y-auto">
                {col.orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChefHat className="mb-2 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Fila vazia</p>
                  </div>
                ) : (
                  col.orders.map((order) => (
                    <div key={order.id} className="rounded-xl border bg-background p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black">#{order.number}</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {channelLabels[order.channel] ?? order.channel}
                          </span>
                          <ElapsedBadge time={order.time} />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{fmt.format(order.total)}</p>
                      </div>
                      {order.status === "pago" && (
                        <p className="text-xs font-bold text-emerald-600">PIX confirmado — aguardando aceite</p>
                      )}
                      <button
                        onClick={() => advance(order.id, order.number)}
                        className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        → Avancar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
