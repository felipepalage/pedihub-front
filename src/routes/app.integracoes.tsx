import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/integracoes")({
  component: IntegrationsPage,
});

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "ativo" | "em_breve" | "disponivel";
  emoji: string;
  color: string;
}

const integrations: Integration[] = [
  {
    id: "ifood",
    name: "iFood",
    description: "Receba pedidos do iFood diretamente no PEDIHUB.",
    status: "em_breve",
    emoji: "🛵",
    color: "bg-primary/10 text-primary",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Atendimento e pedidos via WhatsApp Business.",
    status: "ativo",
    emoji: "💬",
    color: "bg-success/10 text-success",
  },
  {
    id: "site",
    name: "Site próprio",
    description: "Cardápio digital com link e QR Code.",
    status: "disponivel",
    emoji: "🌐",
    color: "bg-info/10 text-info",
  },
  {
    id: "marketplace",
    name: "Marketplace PEDIHUB",
    description: "Em breve: apareça em nossa vitrine.",
    status: "em_breve",
    emoji: "🛍️",
    color: "bg-purple/10 text-purple",
  },
];

const statusBadge = {
  ativo: "bg-success/10 text-success border-success/20",
  em_breve: "bg-warning/15 text-warning border-warning/20",
  disponivel: "bg-info/10 text-info border-info/20",
};

const statusLabel = {
  ativo: "Conectado",
  em_breve: "Em breve",
  disponivel: "Disponível",
};

function IntegrationsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Integrações
        </h1>
        <p className="text-muted-foreground">
          Conecte seus canais de venda em um só painel.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {integrations.map((it) => (
          <article
            key={it.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl ${it.color}`}
              >
                {it.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{it.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge[it.status]}`}
                  >
                    {it.status === "ativo" && <Check className="h-3 w-3" />}
                    {statusLabel[it.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {it.description}
                </p>

                <div className="flex items-center gap-2 mt-5">
                  {it.status === "ativo" ? (
                    <>
                      <Button variant="outline" size="sm">
                        <SettingsIcon className="h-4 w-4" /> Configurar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => toast.success("Desconectado.")}
                      >
                        Desconectar
                      </Button>
                    </>
                  ) : it.status === "disponivel" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        toast.success(`Conectando ${it.name}...`)
                      }
                    >
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
    </div>
  );
}
