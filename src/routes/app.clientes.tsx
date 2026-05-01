import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCustomers, type CustomerSummary } from "@/lib/api";

export const Route = createFileRoute("/app/clientes")({
  component: CustomersPage,
});

const statusStyles = {
  ativo: "border-success/20 bg-success/10 text-success",
  trial: "border-warning/20 bg-warning/15 text-warning",
  inativo: "border-border bg-muted text-muted-foreground",
};

const planStyles = {
  Starter: "bg-muted text-foreground",
  Pro: "bg-info/10 text-info",
  Enterprise: "bg-primary/10 text-primary",
};

import { useAuth } from "@/lib/auth";

function CustomersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (user?.role !== "SuperAdmin") {
    return (
      <div className="mx-auto max-w-[1400px] pt-16 text-center">
        <h1 className="text-3xl font-bold text-destructive">Acesso Restrito</h1>
        <p className="mt-4 text-muted-foreground">Esta página é exclusiva para os administradores da plataforma PEDIHUB.</p>
      </div>
    );
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      getCustomers(search)
        .then(setItems)
        .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os clientes."))
        .finally(() => setLoading(false));
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [search]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clientes</h1>
          <p className="text-muted-foreground">Gestao dos estabelecimentos PEDIHUB.</p>
        </div>
        <Button asChild>
          <Link to="/cadastro">
            <Plus className="h-4 w-4" /> Novo cliente
          </Link>
        </Button>
      </div>

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
                <th className="px-4 py-3 text-left font-medium">Plano</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Ultimo acesso</th>
                <th className="px-4 py-3 text-left font-medium">Data cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    Carregando clientes...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    Nenhum estabelecimento encontrado.
                  </td>
                </tr>
              ) : (
                items.map((customer) => (
                  <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                          {customer.company
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <span className="font-semibold">{customer.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          planStyles[customer.plan],
                        )}
                      >
                        {customer.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                          statusStyles[customer.status],
                        )}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.lastAccessAt ? formatDateTime(customer.lastAccessAt) : "Nunca acessou"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.signupDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
