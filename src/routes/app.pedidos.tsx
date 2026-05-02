import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eye, Printer, MoreHorizontal, Filter, MessageCircle } from "lucide-react";
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
  { id: "pendentes", label: "Pendentes (Novos)" },
  { id: "preparando", label: "Em Preparo" },
  { id: "saiu_entrega", label: "Em Entrega" },
  { id: "finalizados", label: "Finalizados" },
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
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);

  const notificationSound = useMemo(() => {
    const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_7322987a07.mp3");
    audio.volume = 1.0;
    return audio;
  }, []);

  // Request audio permission if needed
  useEffect(() => {
    const unlock = () => {
      notificationSound.play().then(() => {
        notificationSound.pause();
        notificationSound.currentTime = 0;
      }).catch(() => {});
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock);
  }, [notificationSound]);

  const loadOrders = (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    getOrders({ filter, search })
      .then((data) => {
        if (data.length > 0) {
          const newestOrder = data[0];
          if (lastOrderNumber !== null && newestOrder.number > lastOrderNumber && newestOrder.status === "novo") {
            notificationSound.play().catch(e => console.log("Erro ao tocar som:", e));
            toast.info(`Novo pedido recebido! #${newestOrder.number}`, {
              duration: 5000,
              description: newestOrder.customerName
            });
          }
          setLastOrderNumber(newestOrder.number);
        }
        setOrders(data);
      })
      .catch((err) => {
        if (!isAutoRefresh) setError(err instanceof Error ? err.message : "Nao foi possivel carregar os pedidos.");
      })
      .finally(() => {
        if (!isAutoRefresh) setLoading(false);
      });
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, [filter, search, lastOrderNumber]);

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

  const handleWhatsApp = (order: OrderDetail) => {
    if (!order.customerPhone) {
      toast.error("O cliente nao possui numero de WhatsApp cadastrado.");
      return;
    }
    const text = formatOrderToWhatsApp(order);
    const link = generateWhatsAppLink(order.customerPhone, text);
    window.open(link, "_blank");
  };

  const handleStatusWhatsApp = (order: OrderDetail) => {
    if (!order.customerPhone) {
      toast.error("O cliente nao possui numero de WhatsApp cadastrado.");
      return;
    }
    const text = formatStatusUpdateToWhatsApp(order);
    const link = generateWhatsAppLink(order.customerPhone, text);
    window.open(link, "_blank");
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
                  <p className="font-semibold">{selected.customerName}</p>
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
                    <Button className="col-span-2 h-12 text-lg" onClick={onAdvance}>
                      Avancar para: {
                        selected.status === "novo" ? "Aceitar Pedido" :
                        selected.status === "aceito" ? "Iniciar Preparo" :
                        selected.status === "preparando" ? "Despachar Entrega" :
                        selected.status === "saiu_entrega" ? "Finalizar Pedido" : "Concluido"
                      }
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function printOrder(order: Pick<OrderListItem, "number" | "customerName" | "total" | "status" | "channel" | "payment" | "time"> | OrderDetail) {
  const popup = window.open("", "_blank", "width=420,height=640");
  if (!popup) {
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>Pedido #${order.number}</title>
        <style>
          @page { margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10mm; font-size: 12px; color: #000; position: relative; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 40px; color: rgba(0,0,0,0.05); font-weight: 900; z-index: -1; white-space: nowrap; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          .section { margin-bottom: 10px; }
          .section-title { font-weight: bold; border-bottom: 1px dashed #000; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; }
          .item { display: flex; justify-content: space-between; font-weight: bold; }
          .total { border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-weight: 900; font-size: 16px; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; opacity: 0.6; }
          .address { border: 1px solid #000; padding: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="watermark">PEDIHUB DELIVERY</div>
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">#${order.number}</h1>
          <p style="margin:0; font-weight: bold;">${order.customerName.split(' ')[0]}</p>
          <p style="margin:0; font-size: 10px;">${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="section">
          <div class="section-title">Itens do Pedido</div>
          ${('items' in order ? order.items : []).map(item => `
            <div class="item">
              <span>${item.qty}x ${item.name}</span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="total">
            <span>TOTAL</span>
            <span>R$ ${order.total.toFixed(2)}</span>
          </div>
          <p style="text-align: right; margin: 0; font-size: 10px;">Pagamento: ${paymentLabels[order.payment as any] || order.payment}</p>
        </div>

        <div class="address">
          <div class="section-title">Endereco de Entrega</div>
          <p style="margin:0;">${('address' in order ? order.address : 'N/A')}</p>
          <p style="margin:5px 0 0 0; font-weight: bold;">Tel: ${('customerPhone' in order ? order.customerPhone : 'N/A')}</p>
        </div>

        <div class="footer">
          Obrigado pela preferencia!<br>
          <b>Powered by PediHub Digital</b>
        </div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}
