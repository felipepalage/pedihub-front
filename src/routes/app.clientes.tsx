import { createFileRoute } from "@tanstack/react-router";
import { customers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/clientes")({
  component: CustomersPage,
});

const statusStyles = {
  ativo: "bg-success/10 text-success border-success/20",
  trial: "bg-warning/15 text-warning border-warning/20",
  inativo: "bg-muted text-muted-foreground border-border",
};

const planStyles = {
  Starter: "bg-muted text-foreground",
  Pro: "bg-info/10 text-info",
  Enterprise: "bg-primary/10 text-primary",
};

function CustomersPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gestão dos estabelecimentos PEDIHUB.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar empresa..." className="pl-9" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 font-medium">Plano</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">
                  Último acesso
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  Data cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-xs">
                        {c.company
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-semibold">{c.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        planStyles[c.plan],
                      )}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusStyles[c.status],
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.lastAccess}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.signupDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
