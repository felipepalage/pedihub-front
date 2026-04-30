import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrations,
  type Integration,
} from "@/lib/api";

export const Route = createFileRoute("/app/integracoes")({
  component: IntegrationsPage,
});

const statusBadge = {
  ativo: "border-success/20 bg-success/10 text-success",
  em_breve: "border-warning/20 bg-warning/15 text-warning",
  disponivel: "border-info/20 bg-info/10 text-info",
};

const statusLabel = {
  ativo: "Conectado",
  em_breve: "Em breve",
  disponivel: "Disponivel",
};

function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getIntegrations()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar as integracoes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleConnect = async (id: string) => {
    try {
      const updated = await connectIntegration(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success(`${updated.name} conectado com sucesso.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel conectar.");
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const updated = await disconnectIntegration(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success(`${updated.name} desconectado com sucesso.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel desconectar.");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Integracoes</h1>
        <p className="text-muted-foreground">Conecte seus canais de venda em um so painel.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          Carregando integracoes...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive shadow-[var(--shadow-card)]">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {items.map((integration) => (
            <article
              key={integration.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-3xl">
                  {integration.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{integration.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge[integration.status]}`}
                    >
                      {integration.status === "ativo" && <Check className="h-3 w-3" />}
                      {statusLabel[integration.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>

                  <div className="mt-5 flex items-center gap-2">
                    {integration.status === "ativo" ? (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/app/configuracoes">
                            <SettingsIcon className="h-4 w-4" /> Configurar
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Desconectar
                        </Button>
                      </>
                    ) : integration.status === "disponivel" ? (
                      <Button size="sm" onClick={() => handleConnect(integration.id)}>
                        Conectar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Em breve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
