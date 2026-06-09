import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Printer, MoreHorizontal, MessageCircle, LayoutList, Flame, XCircle, StickyNote } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { channelLabels, paymentLabels, statusLabels, getStatusLabelsForOrderType, getValidStatusesForOrderType } from "@/lib/domain";
import {
  advanceOrder,
  cancelOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  type OrderDetail,
  type OrderListItem,
  type OrderStatus,
} from "@/lib/api";
import {
  formatOrderToWhatsApp,
  generateWhatsAppLink,
  formatStatusUpdateToWhatsApp
} from "@/lib/whatsapp";

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
  { id: "aguardando_pix", label: "Aguard. PIX" },
  { id: "pendentes", label: "Pendentes (Novos)" },
  { id: "preparando", label: "Em Preparo" },
  { id: "saiu_entrega", label: "Em Entrega" },
  { id: "finalizados", label: "Finalizados" },
] as const;

function nextStatusLabel(status: OrderStatus): string | undefined {
  const map: Partial<Record<OrderStatus, string>> = {
    pago: "Aceitar",
    novo: "Aceitar",
    aceito: "Preparar",
    preparando: "Despachar",
    saiu_entrega: "Finalizar",
    pronto_retirada: "Finalizar",
  };
  return map[status];
}

const kanbanCols = [
  { id: "aguardando",    label: "Aguard. PIX",        dot: "bg-yellow-400",  header: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400" },
  { id: "novo",          label: "Novos / Pagos",       dot: "bg-orange-500",  header: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400" },
  { id: "aceito",        label: "Aceitos",             dot: "bg-blue-500",    header: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",         text: "text-blue-700 dark:text-blue-400" },
  { id: "preparando",    label: "Em Preparo",          dot: "bg-amber-500",   header: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",     text: "text-amber-700 dark:text-amber-400" },
  { id: "despacho",      label: "Despacho / Pronto",   dot: "bg-purple-500",  header: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-400" },
  { id: "finalizado",    label: "Finalizados",         dot: "bg-green-500",   header: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",     text: "text-green-700 dark:text-green-400" },
] as const;

function requestBrowserNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function fireBrowserNotification(order: OrderListItem) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(`Novo pedido! #${order.number}`, {
      body: `${order.customerName} — ${fmt.format(order.total)}`,
      icon: "/favicon.ico",
    });
  } catch {}
}

function OrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("todos");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "kanban">("lista");
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const lastOrderNumberRef = useRef<number | null>(null);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  const loadOrders = useCallback((isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    getOrders({ filter, search })
      .then((data) => {
        const raw = data as unknown;
        const normalized: OrderListItem[] = Array.isArray(raw)
          ? (raw as OrderListItem[])
          : Array.isArray((raw as any)?.items)
          ? ((raw as any).items as OrderListItem[])
          : [];
        if (normalized.length > 0) {
          const newestOrder = normalized[0];
          const lastNum = lastOrderNumberRef.current;
          if (lastNum !== null && newestOrder.number > lastNum && newestOrder.status === "novo") {
            fireBrowserNotification(newestOrder);
            toast.info(`Novo pedido recebido! #${newestOrder.number}`, {
              duration: 5000,
              description: newestOrder.customerName
            });
          }
          lastOrderNumberRef.current = newestOrder.number;
          setLastOrderNumber(newestOrder.number);
        }
        setOrders(normalized);
      })
      .catch((err) => {
        if (!isAutoRefresh) setError(err instanceof Error ? err.message : "Nao foi possivel carregar os pedidos.");
      })
      .finally(() => {
        if (!isAutoRefresh) setLoading(false);
      });
  }, [filter, search]);

  useEffect(() => {
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadOrders(), 200);
    return () => window.clearTimeout(timeout);
  }, [loadOrders]);

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
      if (selected?.id === orderId) setSelected(updated);
      toast.success(`Status atualizado para ${statusLabels[status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar o pedido.");
    }
  };

  const onAdvance = async () => {
    if (!selected) return;
    try {
      const updated = await advanceOrder(selected.id);
      setSelected(updated);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
      toast.success(`Pedido #${updated.number} avancou para ${statusLabels[updated.status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel avancar o status.");
    }
  };

  const onAdvanceById = async (orderId: string) => {
    try {
      const updated = await advanceOrder(orderId);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
      if (selected?.id === orderId) setSelected(updated);
      toast.success(`Pedido #${updated.number} → ${statusLabels[updated.status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao avancar pedido.");
    }
  };

  const onCancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(selected.id, cancelReason.trim() || undefined);
      setSelected(updated);
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
      toast.success(`Pedido #${updated.number} cancelado.`);
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel cancelar o pedido.");
    } finally {
      setCancelling(false);
    }
  };

  const handleWhatsApp = (order: OrderDetail) => {
    if (!order.customerPhone) { toast.error("O cliente nao possui numero de WhatsApp cadastrado."); return; }
    window.open(generateWhatsAppLink(order.customerPhone, formatOrderToWhatsApp(order)), "_blank");
  };

  const handleStatusWhatsApp = (order: OrderDetail) => {
    if (!order.customerPhone) { toast.error("O cliente nao possui numero de WhatsApp cadastrado."); return; }
    window.open(generateWhatsAppLink(order.customerPhone, formatStatusUpdateToWhatsApp(order)), "_blank");
  };

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  useEffect(() => {
    const pending = orders.filter((o) => o.status === "novo" || o.status === "pago").length;
    document.title = pending > 0 ? `(${pending} novo${pending !== 1 ? "s" : ""}) PediHub` : "PediHub";
    return () => { document.title = "PediHub"; };
  }, [orders]);

  const ordersByCol = useMemo(() => {
    const map: Record<string, OrderListItem[]> = {
      aguardando: [], novo: [], aceito: [], preparando: [], despacho: [], finalizado: [],
    };
    for (const o of orders) {
      if (o.status === "aguardando_pagamento") map.aguardando.push(o);
      else if (o.status === "pago" || o.status === "novo") map.novo.push(o);
      else if (o.status === "aceito") map.aceito.push(o);
      else if (o.status === "preparando") map.preparando.push(o);
      else if (o.status === "saiu_entrega" || o.status === "pronto_retirada") map.despacho.push(o);
      else if (o.status === "finalizado") map.finalizado.push(o);
    }
    return map;
  }, [orders]);


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
        <div className="flex rounded-xl border bg-card overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("lista")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "lista" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutList className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l",
              viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <Flame className="h-4 w-4" /> Operação
          </button>
        </div>
      </div>

      {/* ── OPERAÇÃO VIEW ── */}
      {viewMode === "kanban" && (
        loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando pedidos...</p>
        ) : (
          <>
            <MobileOpsView
              cols={kanbanCols}
              ordersByCol={ordersByCol}
              onOpen={setSelectedId}
              onAdvance={onAdvanceById}
            />
            <div className="hidden lg:flex gap-3 overflow-x-auto pb-2">
              {kanbanCols.map((col) => {
                const colOrders = ordersByCol[col.id] ?? [];
                return (
                  <div key={col.id} className="flex-1 min-w-[220px] max-w-xs flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className={cn("flex items-center justify-between px-3 py-2.5 border-b", col.header)}>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                        <span className={cn("font-bold text-xs", col.text)}>{col.label}</span>
                      </div>
                      <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full text-white", col.dot)}>
                        {colOrders.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 p-2 min-h-[100px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      {colOrders.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                      ) : colOrders.map((order) => (
                        <OpsCard
                          key={order.id}
                          order={order}
                          onOpen={() => setSelectedId(order.id)}
                          onAdvance={() => onAdvanceById(order.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "lista" && (
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
                      <td className="px-4 py-3">{order.customerName}</td>
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
                              {selected?.id === order.id && selected
                                ? getValidStatusesForOrderType(selected.type).map((status) => {
                                    const statusLabel = getStatusLabelsForOrderType(selected.type)[status];
                                    return (
                                      <DropdownMenuItem key={status} onClick={() => updateStatus(order.id, status)}>
                                        Marcar como {statusLabel}
                                      </DropdownMenuItem>
                                    );
                                  })
                                : (Object.keys(statusLabels) as OrderStatus[]).map((status) => (
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
      )}

      {/* ── ORDER DETAIL SHEET ── */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
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
                  <p className="font-semibold">{selected.customerName}</p>
                  {selected.customerPhone && (
                    <p className="text-sm text-muted-foreground">{selected.customerPhone}</p>
                  )}
                  {selected.address ? (
                    <p className="mt-1 text-sm text-muted-foreground">{selected.address}</p>
                  ) : null}
                </div>

                {/* Nota do cliente */}
                {selected.note && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                    <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Observacao do cliente</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">{selected.note}</p>
                    </div>
                  </div>
                )}

                {/* Motivo de cancelamento */}
                {selected.status === "cancelado" && selected.cancellationReason && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <p className="text-xs font-semibold text-destructive">Motivo do cancelamento</p>
                      <p className="text-sm text-destructive/80">{selected.cancellationReason}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium">Itens</p>
                  <ul className="space-y-2">
                    {selected.items.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <span>{item.qty}× {item.name}</span>
                        <span className="font-medium">{fmt.format(item.price * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(selected.deliveryFee > 0 || selected.couponDiscount > 0) && (
                  <div className="space-y-1 border-t pt-3">
                    {selected.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Taxa de entrega</span>
                        <span>{fmt.format(selected.deliveryFee)}</span>
                      </div>
                    )}
                    {selected.couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto{selected.couponCode ? ` (${selected.couponCode})` : ""}</span>
                        <span>-{fmt.format(selected.couponDiscount)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{fmt.format(selected.total)}</span>
                </div>

                {selected.changeFor && selected.changeFor > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Troco para: {fmt.format(selected.changeFor)}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => printOrder(selected)}>
                    Imprimir Comanda
                  </Button>
                  <Button variant="secondary" onClick={() => handleWhatsApp(selected)}>
                    Enviar Resumo
                  </Button>
                  <Button variant="outline" className="col-span-2" onClick={() => handleStatusWhatsApp(selected)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Notificar Status (WhatsApp)
                  </Button>

                  {selected.status !== "finalizado" && selected.status !== "cancelado" && (
                    <>
                      <Button className="col-span-2 h-12 text-lg" onClick={onAdvance}>
                        {nextStatusLabel(selected.status)
                          ? `→ ${nextStatusLabel(selected.status)}`
                          : "Concluir pedido"}
                      </Button>
                      <Button
                        variant="outline"
                        className="col-span-2 border-destructive/40 text-destructive hover:bg-destructive/5"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar pedido
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── CANCEL DIALOG ── */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => { if (!open) { setCancelDialogOpen(false); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cancelar Pedido #{selected?.number}
            </DialogTitle>
            <DialogDescription>
              Essa acao nao pode ser desfeita. O pedido sera marcado como cancelado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Motivo do cancelamento <span className="text-muted-foreground">(opcional)</span></label>
            <textarea
              className="w-full rounded-xl border bg-muted/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Ex: cliente solicitou, produto indisponivel, endereco invalido..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setCancelReason(""); }}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OpsCard({
  order,
  onOpen,
  onAdvance,
}: {
  order: OrderListItem;
  onOpen: () => void;
  onAdvance: () => void;
}) {
  const next = nextStatusLabel(order.status);
  return (
    <div
      onClick={onOpen}
      className="rounded-xl border bg-background p-3 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-black">#{order.number}</span>
        <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
          {channelLabels[order.channel] ?? order.channel}
        </span>
      </div>
      <p className="text-sm font-semibold truncate">{order.customerName}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-muted-foreground">{order.time}</span>
        <span className="text-sm font-bold text-primary">{fmt.format(order.total)}</span>
      </div>
      {order.status === "pago" && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          PIX Pago — aguardando aceite
        </div>
      )}
      {order.status === "aguardando_pagamento" && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-yellow-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
          Aguardando pagamento PIX
        </div>
      )}
      {next && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdvance(); }}
          className="mt-2 w-full rounded-lg bg-primary/10 text-primary text-xs font-bold py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          → {next}
        </button>
      )}
    </div>
  );
}

function MobileOpsView({
  cols,
  ordersByCol,
  onOpen,
  onAdvance,
}: {
  cols: typeof kanbanCols;
  ordersByCol: Record<string, OrderListItem[]>;
  onOpen: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  const [active, setActive] = useState<string>(cols[0].id);
  const activeCol = cols.find(c => c.id === active)!;
  const colOrders = ordersByCol[active] ?? [];

  return (
    <div className="lg:hidden space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cols.map(col => {
          const count = ordersByCol[col.id]?.length ?? 0;
          const isActive = active === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActive(col.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-colors",
                isActive
                  ? `${col.dot} text-white border-transparent shadow-sm`
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {col.label}
              <span className={cn("rounded-full px-1.5 py-0.5", isActive ? "bg-white/25" : "bg-muted")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {colOrders.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed">
          <p className="text-sm text-muted-foreground">Nenhum pedido em <strong>{activeCol.label}</strong></p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {colOrders.map(order => (
            <OpsCard
              key={order.id}
              order={order}
              onOpen={() => onOpen(order.id)}
              onAdvance={() => onAdvance(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function printOrder(order: Pick<OrderListItem, "number" | "customerName" | "total" | "status" | "channel" | "payment" | "time"> | OrderDetail) {
  const popup = window.open("", "_blank", "width=480,height=700");
  if (!popup) return;

  const detail = "items" in order ? order as OrderDetail : null;
  const subtotal = detail ? detail.total - detail.deliveryFee + (detail.couponDiscount || 0) : order.total;
  const addressLine = detail
    ? detail.type === "pickup"
      ? "Retirada no Local"
      : [detail.street, detail.addressNumber, detail.neighborhood, detail.complement].filter(Boolean).join(", ")
    : "";

  const itemsHtml = (detail?.items ?? [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:5px 0;border-bottom:1px dashed #ddd">${item.qty}x ${item.name}</td>
          <td style="padding:5px 0;border-bottom:1px dashed #ddd;text-align:right;white-space:nowrap">R$ ${(item.qty * item.price).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const noteHtml = detail?.note ? `<p class="section-lbl">Observacao do cliente</p><p style="font-size:12px;background:#fffbeb;padding:6px;border-radius:4px;border-left:3px solid #f59e0b">${detail.note}</p>` : "";

  popup.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Nota Fiscal - Pedido #${order.number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; max-width: 380px; margin: 0 auto; padding: 20px 16px; color: #111; background: #fff; font-size: 13px; }
    .brand { text-align: center; font-size: 18px; font-weight: 900; letter-spacing: -1px; }
    .order-badge { text-align: center; background: #111; color: #fff; display: inline-block; padding: 3px 14px; border-radius: 99px; font-size: 12px; font-weight: bold; margin: 6px auto; }
    hr { border: none; border-top: 1.5px dashed #ccc; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
    .row.bold { font-weight: 900; font-size: 15px; padding-top: 8px; border-top: 2px solid #111; margin-top: 6px; }
    .muted { color: #777; }
    .section-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 10px 0 4px; }
    .center { text-align: center; }
    .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    @media print { button { display: none !important; } }
  </style>
</head>
<body>
  <div class="brand">COMANDA / NOTA FISCAL</div>
  <div class="center"><span class="order-badge">PEDIDO #${order.number}</span></div>
  <div class="center muted" style="font-size:11px;margin-bottom:6px">${new Date().toLocaleString("pt-BR")}</div>
  <div class="center muted" style="font-size:11px">${channelLabels[order.channel] ?? order.channel}</div>
  <hr />
  <p class="section-lbl">Cliente</p>
  <p style="font-weight:bold">${order.customerName}</p>
  ${detail ? `<p class="muted" style="font-size:11px">${detail.customerPhone}</p>` : ""}
  ${addressLine ? `<p class="section-lbl">Endereço / Retirada</p><p style="font-size:12px">${addressLine}</p>` : ""}
  ${noteHtml}
  <hr />
  <p class="section-lbl">Itens</p>
  <table>
    <tbody>
      ${itemsHtml || `<tr><td colspan="2" style="padding:6px 0" class="muted">—</td></tr>`}
    </tbody>
  </table>
  <div style="margin-top:12px">
    <div class="row muted"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span></div>
    ${detail && detail.deliveryFee > 0 ? `<div class="row muted"><span>Taxa de entrega</span><span>R$ ${detail.deliveryFee.toFixed(2)}</span></div>` : ""}
    ${detail && detail.couponDiscount > 0 ? `<div class="row" style="color:#16a34a"><span>Desconto${detail.couponCode ? ` (${detail.couponCode})` : ""}</span><span>-R$ ${detail.couponDiscount.toFixed(2)}</span></div>` : ""}
    <div class="row bold"><span>TOTAL</span><span>R$ ${order.total.toFixed(2)}</span></div>
    <div class="row muted" style="margin-top:4px"><span>Pagamento</span><span>${paymentLabels[order.payment as any] || order.payment}${detail?.changeFor ? ` (troco R$ ${detail.changeFor.toFixed(2)})` : ""}</span></div>
  </div>
  <hr />
  <div class="footer">
    <p>Obrigado pela preferencia!</p>
    <p style="margin-top:3px">Gerenciado via <strong>PEDIHUB</strong></p>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
  popup.document.close();
}
