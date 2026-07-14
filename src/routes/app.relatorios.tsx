import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FileText, CalendarDays, X, Radio } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadReportsCsv, getReports, type ReportsResponse, type ChannelBreakdownItem } from "@/lib/api";
import { channelLabels } from "@/lib/domain";
import { toast } from "sonner";

export const Route = createFileRoute("/app/relatorios")({
  component: ReportsPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// default range: first day of current month → today
function defaultFrom() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function ReportsPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());

  useEffect(() => {
    setLoading(true);
    setError("");
    getReports({ from, to })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os relatorios."))
      .finally(() => setLoading(false));
  }, [from, to]);

  const onExportCsv = async () => {
    try {
      const blob = await downloadReportsCsv({ from, to });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedihub-relatorio-${from}-${to}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel exportar o CSV.");
    }
  };

  const resetDates = () => {
    setFrom(defaultFrom());
    setTo(defaultTo());
  };

  const isCustomRange = from !== defaultFrom() || to !== defaultTo();

  if (loading && !data) {
    return <PageState message="Carregando relatorios..." />;
  }

  if (error || !data) {
    return <PageState message={error || "Relatorios indisponiveis."} destructive />;
  }

  const topProductMax = Math.max(...data.topProducts.map((item) => item.sold), 1);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Relatorios</h1>
          <p className="text-muted-foreground">Insights reais para crescer seu negocio.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          {/* Date range filter */}
          <div className="flex items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">De</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-7 w-32 border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                />
              </div>
              <span className="text-muted-foreground">—</span>
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Ate</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-7 w-32 border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                />
              </div>
            </div>
            {isCustomRange && (
              <button
                onClick={resetDates}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Limpar filtro"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={onExportCsv} disabled={loading}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={loading}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Atualizando dados...
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {data.summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Faturamento mensal</h3>
          <p className="mb-4 text-xs text-muted-foreground">Ultimos 6 meses</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
                formatter={(value: number) => fmt.format(value)}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ fill: "var(--color-primary)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Horarios de pico</h3>
          <p className="mb-4 text-xs text-muted-foreground">Pedidos por hora</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b p-5">
          <h3 className="font-semibold">Produtos mais vendidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Produto</th>
                <th className="px-4 py-3 text-right font-medium">Vendidos</th>
                <th className="px-4 py-3 text-right font-medium">Receita</th>
                <th className="w-1/3 px-4 py-3 text-left font-medium">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-muted-foreground">
                    Ainda nao ha vendas suficientes para gerar esse ranking.
                  </td>
                </tr>
              ) : (
                data.topProducts.map((product) => (
                  <tr key={product.name} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-right">{product.sold}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt.format(product.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(product.sold / topProductMax) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 font-semibold">Vendas semanais</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.weeklySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip formatter={(value: number) => fmt.format(value)} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.channelBreakdown && data.channelBreakdown.length > 0 && (
        <ChannelBreakdownSection items={data.channelBreakdown} />
      )}
    </div>
  );
}

const channelColors: Record<string, string> = {
  ifood: "#EA1D2C",
  "99food": "#FFD700",
  whatsapp: "#25D366",
  site: "#6366F1",
  balcao: "#F97316",
  mesa: "#8B5CF6",
};

function ChannelBreakdownSection({ items }: { items: ChannelBreakdownItem[] }) {
  const totalOrders = items.reduce((s, i) => s + i.orders, 0);
  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
  const maxOrders = Math.max(...items.map((i) => i.orders), 1);
  const hasPercentage = items.some((i) => i.percentage !== undefined);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b p-5">
        <Radio className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">Pedidos por canal</h3>
      </div>
      <div className="divide-y">
        {items.map((item) => {
          const color = channelColors[item.channel] ?? "var(--color-primary)";
          const pct = (item.orders / maxOrders) * 100;
          const revPct = hasPercentage
            ? (item.percentage ?? 0).toFixed(0)
            : totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(0) : "0";
          return (
            <div key={item.channel} className="flex items-center gap-4 px-5 py-3">
              <div
                className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: color }}
              >
                {(channelLabels[item.channel as keyof typeof channelLabels] ?? item.channel).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">
                    {channelLabels[item.channel as keyof typeof channelLabels] ?? item.channel}
                  </span>
                  <span className="text-xs text-muted-foreground">{revPct}% da receita</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">{item.orders} pedidos</p>
                <p className="text-xs text-muted-foreground">{fmt.format(item.revenue)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
        <span className="text-xs text-muted-foreground">Total</span>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span>{totalOrders} pedidos</span>
          <span>{fmt.format(totalRevenue)}</span>
        </div>
      </div>
    </div>
  );
}

function PageState({ message, destructive = false }: { message: string; destructive?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <p className={destructive ? "text-destructive" : "text-muted-foreground"}>{message}</p>
    </div>
  );
}
