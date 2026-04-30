import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  orders,
  salesByDay,
  ordersByHour,
  channelMix,
  channelLabels,
} from "@/lib/mock-data";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function DashboardPage() {
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Olá, Adega 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do seu dia.
          </p>
        </div>
        <Link
          to="/app/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ver todos pedidos →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Pedidos hoje"
          value="42"
          delta="+18% vs ontem"
          trend="up"
          icon={ShoppingBag}
          accent="primary"
        />
        <StatCard
          label="Faturamento hoje"
          value={fmt.format(2840.5)}
          delta="+12% vs ontem"
          trend="up"
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="Ticket médio"
          value={fmt.format(67.6)}
          delta="−3% vs ontem"
          trend="down"
          icon={Receipt}
          accent="info"
        />
        <StatCard
          label="Pendentes"
          value="7"
          delta="3 novos pedidos"
          icon={Clock}
          accent="warning"
        />
        <StatCard
          label="Entregues"
          value="32"
          delta="100% no prazo"
          trend="up"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Cancelamentos"
          value="3"
          delta="7% do total"
          icon={XCircle}
          accent="destructive"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Vendas — últimos 7 dias</h3>
              <p className="text-xs text-muted-foreground">
                Faturamento diário
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
              <TrendingUp className="h-4 w-4" /> +24,5%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesByDay}>
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
                formatter={(v: number) => fmt.format(v)}
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
          <p className="text-xs text-muted-foreground mb-2">Mix do mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={channelMix}
                dataKey="value"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {channelMix.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {channelMix.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </span>
                <span className="font-semibold">{c.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-1">Pedidos por horário</h3>
          <p className="text-xs text-muted-foreground mb-4">Hoje</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersByHour}>
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
          <h3 className="font-semibold mb-3">Alertas operacionais</h3>
          <ul className="space-y-3">
            {[
              { t: "Estoque baixo: Whisky 12 anos (5 un.)", c: "warning" },
              { t: "Pedido #1042 aguardando aceite há 4 min", c: "destructive" },
              { t: "iFood: integração disponível em breve", c: "info" },
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-1 h-7 w-7 shrink-0 rounded-lg flex items-center justify-center bg-${a.c}/10 text-${a.c}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <p className="text-sm">{a.t}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold">Últimos pedidos</h3>
          <Link
            to="/app/pedidos"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="divide-y">
          {recent.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold">
                #{o.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{o.customer}</p>
                <p className="text-xs text-muted-foreground">
                  {channelLabels[o.channel]} · {o.time}
                </p>
              </div>
              <StatusBadge status={o.status} />
              <div className="font-semibold w-24 text-right">
                {fmt.format(o.total)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
