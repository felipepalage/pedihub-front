import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Printer, MoreHorizontal, Filter } from "lucide-react";
import {
  orders,
  channelLabels,
  paymentLabels,
  statusLabels,
  type OrderStatus,
} from "@/lib/mock-data";
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
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<(typeof orders)[number] | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        String(o.number).includes(search);
      if (!matchesSearch) return false;
      if (filter === "todos" || filter === "hoje") return true;
      if (filter === "pendentes")
        return ["novo", "aceito", "preparando", "saiu_entrega"].includes(o.status);
      if (filter === "finalizados") return o.status === "finalizado";
      if (filter === "cancelados") return o.status === "cancelado";
      return true;
    });
  }, [filter, search]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Pedidos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seus pedidos em tempo real.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                filter === f.id
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card border-border hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar pedido ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-64"
        />
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Pedido</th>
                <th className="text-left font-medium px-4 py-3">Canal</th>
                <th className="text-left font-medium px-4 py-3">Cliente</th>
                <th className="text-right font-medium px-4 py-3">Valor</th>
                <th className="text-left font-medium px-4 py-3">Horário</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Pagamento</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    <p className="font-medium">Nenhum pedido encontrado</p>
                    <p className="text-xs mt-1">Tente ajustar os filtros.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">#{o.number}</td>
                    <td className="px-4 py-3">{channelLabels[o.channel]}</td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt.format(o.total)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.time}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">{paymentLabels[o.payment]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setSelected(o)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => toast.success("Imprimindo pedido...")}
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
                            {(Object.keys(statusLabels) as OrderStatus[]).map(
                              (s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() =>
                                    toast.success(
                                      `Status atualizado: ${statusLabels[s]}`,
                                    )
                                  }
                                >
                                  Marcar como {statusLabels[s]}
                                </DropdownMenuItem>
                              ),
                            )}
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
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
                  {selected.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selected.address}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Itens</p>
                  <ul className="space-y-2">
                    {selected.items.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span>
                          {it.qty}× {it.name}
                        </span>
                        <span className="font-medium">
                          {fmt.format(it.price * it.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {fmt.format(selected.total)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">Imprimir</Button>
                  <Button>Avançar status</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
