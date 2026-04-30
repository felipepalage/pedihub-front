import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eye, Printer, MoreHorizontal, Filter } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { channelLabels, paymentLabels, statusLabels } from "@/lib/domain";
import {
  advanceOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  type OrderDetail,
  type OrderListItem,
  type OrderStatus,
} from "@/lib/api";

export const Route = createFileRoute("/app/pedidos")({
  component: OrdersPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const filters = [
  { id: "todos", label: "Todos" },
  { id: "hoje", label: "Hoje" },
  { id: "pendentes", label: "Pendentes" },
  { id: "finalizados", label: "Finalizados" },
  { id: "cancelados", label: "Cancelados" },
] as const;

function OrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("todos");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = () => {
    setLoading(true);
    getOrders({ filter, search })
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os pedidos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => loadOrders(), 200);
    return () => window.clearTimeout(timeout);
  }, [filter, search]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    setLoadingDetail(true);
    getOrder(selectedId)
      .then(setSelected)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Nao foi possivel carregar o pedido."))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
      if (selected?.id === orderId) {
        setSelected(updated);
      }
      toast.success(`Status atualizado para ${statusLabels[status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar o pedido.");
    }
  };

  const onAdvance = async () => {
    if (!selected) {
      return;
    }

    try {
      const updated = await advanceOrder(selected.id);
      setSelected(updated);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
      toast.success(`Pedido #${updated.number} avancou para ${statusLabels[updated.status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel avancar o status.");
    }
  };

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe seus pedidos em tempo real.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === item.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar pedido ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-64"
        />
        <Button variant="outline" size="icon" aria-label="Filtrar pedidos">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Canal</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Horario</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    Carregando pedidos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <p className="font-medium">Nenhum pedido encontrado</p>
                    <p className="mt-1 text-xs">A lista vai aparecer aqui assim que sua operacao gerar pedidos.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">#{order.number}</td>
                    <td className="px-4 py-3">{channelLabels[order.channel]}</td>
                    <td className="px-4 py-3">{order.customer}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt.format(order.total)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.time}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">{paymentLabels[order.payment]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setSelectedId(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => printOrder(activeOrder?.id === order.id && selected ? selected : order)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
                              <DropdownMenuItem key={status} onClick={() => updateStatus(order.id, status)}>
                                Marcar como {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {loadingDetail || !selected ? (
            <div className="mt-6 text-sm text-muted-foreground">Carregando pedido...</div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Pedido #{selected.number}</SheetTitle>
                <SheetDescription>
                  {channelLabels[selected.channel]} · {selected.time}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selected.customer}</p>
                  {selected.address ? (
                    <p className="mt-1 text-sm text-muted-foreground">{selected.address}</p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Itens</p>
                  <ul className="space-y-2">
                    {selected.items.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <span>
                          {item.qty}× {item.name}
                        </span>
                        <span className="font-medium">{fmt.format(item.price * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{fmt.format(selected.total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => printOrder(selected)}>
                    Imprimir
                  </Button>
                  <Button onClick={onAdvance}>Avancar status</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function printOrder(order: Pick<OrderListItem, "number" | "customer" | "total" | "status" | "channel" | "payment" | "time"> | OrderDetail) {
  const popup = window.open("", "_blank", "width=420,height=640");
  if (!popup) {
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>Pedido #${order.number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 8px; }
          p { margin: 6px 0; }
        </style>
      </head>
      <body>
        <h1>Pedido #${order.number}</h1>
        <p><strong>Cliente:</strong> ${order.customer}</p>
        <p><strong>Canal:</strong> ${channelLabels[order.channel]}</p>
        <p><strong>Horario:</strong> ${order.time}</p>
        <p><strong>Status:</strong> ${statusLabels[order.status]}</p>
        <p><strong>Pagamento:</strong> ${paymentLabels[order.payment]}</p>
        <p><strong>Total:</strong> ${fmt.format(order.total)}</p>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}
