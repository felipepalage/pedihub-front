import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { downloadReportsCsv, getReports, type ReportsResponse } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/relatorios")({
  component: ReportsPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function ReportsPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getReports()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os relatorios."))
      .finally(() => setLoading(false));
  }, []);

  const onExportCsv = async () => {
    try {
      const blob = await downloadReportsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pedihub-relatorio.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel exportar o CSV.");
    }
  };

  if (loading) {
    return <PageState message="Carregando relatorios..." />;
  }

  if (error || !data) {
    return <PageState message={error || "Relatorios indisponiveis."} destructive />;
  }

  const topProductMax = Math.max(...data.topProducts.map((item) => item.sold), 1);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Relatorios</h1>
          <p className="text-muted-foreground">Insights reais para crescer seu negocio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

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
