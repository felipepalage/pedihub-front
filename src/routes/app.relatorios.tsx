import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
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
import { topProducts, ordersByHour, salesByDay } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/relatorios")({
  component: ReportsPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthly = [
  { m: "Nov", value: 38400 },
  { m: "Dez", value: 52100 },
  { m: "Jan", value: 41200 },
  { m: "Fev", value: 47800 },
  { m: "Mar", value: 55600 },
  { m: "Abr", value: 61300 },
];

function ReportsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Insights para crescer seu negócio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success("Exportado em CSV")}
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Exportado em PDF")}
          >
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { l: "Faturamento mensal", v: fmt.format(61300) },
          { l: "Ticket médio", v: fmt.format(67.6) },
          { l: "Cancelamentos", v: "4,8%" },
          { l: "Pedidos no mês", v: "907" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          >
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="text-2xl font-bold mt-1">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold">Faturamento mensal</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
                formatter={(v: number) => fmt.format(v)}
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
          <h3 className="font-semibold">Horários de pico</h3>
          <p className="text-xs text-muted-foreground mb-4">Pedidos por hora</p>
          <ResponsiveContainer width="100%" height={260}>
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
              <Bar dataKey="value" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Produtos mais vendidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Produto</th>
                <th className="text-right px-4 py-3 font-medium">Vendidos</th>
                <th className="text-right px-4 py-3 font-medium">Receita</th>
                <th className="text-left px-4 py-3 font-medium w-1/3">
                  Volume
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topProducts.map((p, i) => {
                const max = Math.max(...topProducts.map((x) => x.sold));
                return (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right">{p.sold}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt.format(p.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(p.sold / max) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini sales weekly */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="font-semibold mb-4">Vendas semanais</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salesByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip formatter={(v: number) => fmt.format(v)} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
