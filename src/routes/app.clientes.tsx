import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, ShoppingBag, TrendingUp, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCustomers, getCustomerHistory, type CustomerSummary, type CustomerHistory } from "@/lib/api";
import { statusLabels } from "@/lib/domain";
import { useAuth } from "@/lib/auth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/clientes")({
  component: CustomersPage,
});

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusStyles = {
  ativo: "border-success/20 bg-success/10 text-success",
  trial: "border-warning/20 bg-warning/15 text-warning",
  inativo: "border-border bg-muted text-muted-foreground",
};

const fmtCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function exportCsv(items: CustomerSummary[]) {
  const header = ["Empresa", "Telefone", "Status", "Pedidos", "Total Gasto", "Ultimo Pedido", "Cadastro"];
  const rows = items.map((c) => [
    c.company ?? "",
    c.phone ?? "",
    c.status,
    String(c.orderCount),
    fmtCurrency.format(c.totalSpent),
    c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "—",
    formatDate(c.signupDate),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedihub-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── SuperAdmin view ──────────────────────────────────────────────
function AdminCustomersView() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getCustomers(search)
        .then(setItems)
        .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os clientes."))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const chartData = [...items]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map((c) => ({ name: c.company?.split(" ")[0] ?? "—", total: c.totalSpent, pedidos: c.orderCount }));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clientes</h1>
          <p className="text-muted-foreground">Gestao dos estabelecimentos PEDIHUB.</p>
        </div>
        <Button variant="outline" onClick={() => exportCsv(items)} disabled={items.length === 0}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {!loading && chartData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-1 font-semibold">Top 10 por faturamento</h3>
          <p className="mb-4 text-xs text-muted-foreground">Total gasto pelos estabelecimentos</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(value: number) => fmtCurrency.format(value)}
              />
              <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Total gasto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Empresa</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                <th className="px-4 py-3 text-right font-medium">Total gasto</th>
                <th className="px-4 py-3 text-left font-medium">Ultimo pedido</th>
                <th className="px-4 py-3 text-left font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Carregando clientes...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="py-16 text-center text-destructive">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Nenhum estabelecimento encontrado.</td></tr>
              ) : items.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                        {(customer.company ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{customer.company}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[customer.status])}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{customer.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt.format(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.signupDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Merchant customer history view ──────────────────────────────
function CustomerHistoryCard({ history }: { history: CustomerHistory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
          {history.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{history.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {history.phone}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-center">
          <div>
            <p className="text-lg font-black text-primary">{history.totalOrders}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pedidos</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt.format(history.totalSpent)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total gasto</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="ml-1 text-xs">{expanded ? "Ocultar" : "Ver pedidos"}</span>
        </Button>
      </div>

      {/* Mobile stats */}
      <div className="flex sm:hidden items-center gap-6 px-5 pb-4">
        <div>
          <p className="text-base font-black text-primary">{history.totalOrders} pedidos</p>
        </div>
        <div>
          <p className="text-base font-black">{fmt.format(history.totalSpent)}</p>
        </div>
      </div>

      {expanded && (
        <div className="border-t divide-y">
          {history.orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          ) : history.orders.map((order) => (
            <div key={order.number} className="flex items-center gap-3 px-5 py-3">
              <span className="text-sm font-bold text-muted-foreground w-10">#{order.number}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {new Date(order.orderedAt).toLocaleDateString("pt-BR")} — {order.items.slice(0, 2).map((i) => `${i.qty}x ${i.name}`).join(", ")}
                  {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                </p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                order.status === "finalizado" ? "bg-success/10 text-success border-success/20" :
                order.status === "cancelado" ? "bg-destructive/10 text-destructive border-destructive/20" :
                "bg-muted text-muted-foreground border-border"
              )}>
                {statusLabels[order.status] ?? order.status}
              </span>
              <span className="text-sm font-bold shrink-0">{fmt.format(order.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MerchantCustomersView() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const clean = query.replace(/\D/g, "");
    if (clean.length < 8) return;
    setLoading(true);
    setError("");
    setHistory(null);
    try {
      const data = await getCustomerHistory(clean);
      setHistory(data);
    } catch (err: any) {
      setError(err?.message ?? "Cliente nao encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clientes</h1>
        <p className="text-muted-foreground">Consulte o historico de pedidos de um cliente pelo telefone.</p>
      </div>

      <div className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Telefone do cliente (ex: 11987654321)"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || query.replace(/\D/g, "").length < 8}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!history && !loading && !error && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Busque um cliente pelo telefone</p>
            <p className="text-sm text-muted-foreground">Digite o numero e pressione Buscar para ver o historico de pedidos.</p>
          </div>
        </div>
      )}

      {history && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total de pedidos</span>
              </div>
              <p className="text-2xl font-black text-primary">{history.totalOrders}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total gasto</span>
              </div>
              <p className="text-2xl font-black">{fmt.format(history.totalSpent)}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Ticket medio</span>
              </div>
              <p className="text-2xl font-black">
                {history.totalOrders > 0 ? fmt.format(history.totalSpent / history.totalOrders) : "—"}
              </p>
            </div>
          </div>
          <CustomerHistoryCard history={history} />
        </div>
      )}
    </div>
  );
}

function CustomersPage() {
  const { user } = useAuth();

  if (user?.role === "SuperAdmin") {
    return <AdminCustomersView />;
  }

  return <MerchantCustomersView />;
}

function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}
