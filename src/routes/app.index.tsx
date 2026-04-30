import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { channelLabels } from "@/lib/domain";
import { getDashboard, type DashboardSummary } from "@/lib/api";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const alertStyles = {
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageState message="Carregando dashboard..." />;
  }

  if (error || !data) {
    return <PageState message={error || "Dashboard indisponivel."} destructive />;
  }

  const recent = data.recentOrders;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ola, {data.merchantName}!</h1>
          <p className="text-muted-foreground">Aqui esta um resumo do seu dia.</p>
        </div>
        <Link
          to="/app/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ver todos pedidos →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pedidos hoje"
          value={String(data.stats.ordersToday)}
          delta={`${formatDelta(data.stats.ordersDeltaPercent)} vs ontem`}
          trend={data.stats.ordersDeltaPercent >= 0 ? "up" : "down"}
          icon={ShoppingBag}
          accent="primary"
        />
        <StatCard
          label="Faturamento hoje"
          value={fmt.format(data.stats.revenueToday)}
          delta={`${formatDelta(data.stats.revenueDeltaPercent)} vs ontem`}
          trend={data.stats.revenueDeltaPercent >= 0 ? "up" : "down"}
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="Ticket medio"
          value={fmt.format(data.stats.averageTicketToday)}
          delta={`${formatDelta(data.stats.averageTicketDeltaPercent)} vs ontem`}
          trend={data.stats.averageTicketDeltaPercent >= 0 ? "up" : "down"}
          icon={Receipt}
          accent="info"
        />
        <StatCard
          label="Pendentes"
          value={String(data.stats.pendingOrders)}
          delta="Pedidos aguardando acao"
          icon={Clock}
          accent="warning"
        />
        <StatCard
          label="Entregues"
          value={String(data.stats.deliveredOrders)}
          delta="Pedidos finalizados hoje"
          trend="up"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Cancelamentos"
          value={String(data.stats.cancelledOrders)}
          delta="Pedidos cancelados hoje"
          icon={XCircle}
          accent="destructive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Vendas - ultimos 7 dias</h3>
              <p className="text-xs text-muted-foreground">Faturamento diario</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
              <TrendingUp className="h-4 w-4" />
              {formatDelta(data.stats.revenueDeltaPercent)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.salesByDay}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
                formatter={(value: number) => fmt.format(value)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Canal de vendas</h3>
          <p className="mb-2 text-xs text-muted-foreground">Distribuicao dos pedidos</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.channelMix} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.channelMix.map((entry) => (
                  <Cell key={entry.channel} fill={channelColor(entry.channel)} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {data.channelMix.map((channel) => (
              <li key={channel.channel} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: channelColor(channel.channel) }}
                  />
                  {channel.name}
                </span>
                <span className="font-semibold">{channel.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h3 className="mb-1 font-semibold">Pedidos por horario</h3>
          <p className="mb-4 text-xs text-muted-foreground">Hoje</p>
          <ResponsiveContainer width="100%" height={220}>
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
              <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-3 font-semibold">Alertas operacionais</h3>
          {data.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
          ) : (
            <ul className="space-y-3">
              {data.alerts.map((alert, index) => (
                <li key={`${alert.text}-${index}`} className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${alertStyles[alert.severity]}`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <p className="text-sm">{alert.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="font-semibold">Ultimos pedidos</h3>
          <Link to="/app/pedidos" className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum pedido cadastrado ainda.</div>
        ) : (
          <div className="divide-y">
            {recent.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                  #{order.number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {channelLabels[order.channel]} · {order.time}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <div className="w-24 text-right font-semibold">{fmt.format(order.total)}</div>
              </div>
            ))}
          </div>
        )}
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

function formatDelta(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function channelColor(channel: string) {
  switch (channel) {
    case "ifood":
      return "var(--color-primary)";
    case "whatsapp":
      return "var(--color-success)";
    case "site":
      return "var(--color-info)";
    default:
      return "var(--color-warning)";
  }
}
