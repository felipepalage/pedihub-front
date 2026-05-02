import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Settings as SettingsIcon,
  MessageCircle,
  Globe,
  Copy,
  ExternalLink,
  Clock,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  QrCode,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/integracoes")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { user } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savedWhatsappNumber, setSavedWhatsappNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setWhatsappNumber(settings.whatsAppNumber || "");
        setSavedWhatsappNumber(settings.whatsAppNumber || "");
        setSlug(settings.slug || "");
      })
      .catch(() => toast.error("Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  const storeUrl = slug ? `${window.location.origin}/${slug}` : "";
  const whatsappConnected = !!savedWhatsappNumber;
  const siteConnected = !!slug;

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    try {
      const settings = await getSettings();
      await updateSettings({ ...settings, whatsAppNumber: whatsappNumber });
      setSavedWhatsappNumber(whatsappNumber);
      toast.success("WhatsApp configurado com sucesso!");
      setWhatsappModalOpen(false);
    } catch {
      toast.error("Erro ao salvar número.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setSaving(true);
    try {
      const settings = await getSettings();
      await updateSettings({ ...settings, whatsAppNumber: "" });
      setSavedWhatsappNumber("");
      setWhatsappNumber("");
      toast.success("WhatsApp desconectado.");
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
        Carregando integrações...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte seus canais de venda e receba pedidos de qualquer lugar em um só painel.
        </p>
      </div>

      {/* WhatsApp */}
      <IntegrationCard
        icon={<MessageCircle className="h-7 w-7 text-[#25D366]" />}
        iconBg="bg-[#25D366]/10"
        name="WhatsApp"
        description="Compartilhe seu cardápio digital com clientes via WhatsApp e receba os pedidos diretamente no seu painel."
        status={whatsappConnected ? "ativo" : "disponivel"}
        badge={
          whatsappConnected ? (
            <StatusBadge color="success">
              <Check className="h-3 w-3" /> Ativo
            </StatusBadge>
          ) : (
            <StatusBadge color="neutral">Não configurado</StatusBadge>
          )
        }
      >
        {whatsappConnected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#25D366]" />
                <p className="font-semibold text-[#25D366]">WhatsApp configurado!</p>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">{savedWhatsappNumber}</span>
              </div>
            </div>

            {storeUrl && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">
                  Link do cardápio para compartilhar
                </Label>
                <div className="flex gap-2">
                  <Input value={storeUrl} readOnly className="font-mono text-xs bg-muted/30" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(storeUrl, "whatsapp-link")}
                  >
                    {copied === "whatsapp-link" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(storeUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envie este link para seus clientes pelo WhatsApp. Os pedidos chegam automaticamente no painel.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setWhatsappModalOpen(true)}>
                <SettingsIcon className="h-4 w-4" /> Alterar número
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={handleDisconnectWhatsApp}
                disabled={saving}
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <HowItWorks
              steps={[
                "Configure seu número de WhatsApp abaixo",
                "Compartilhe o link do seu cardápio com clientes via WhatsApp",
                "Os pedidos aparecem automaticamente no painel com canal "WhatsApp"",
              ]}
            />
            <Button size="sm" onClick={() => setWhatsappModalOpen(true)}>
              <MessageCircle className="h-4 w-4" /> Configurar WhatsApp
            </Button>
          </div>
        )}
      </IntegrationCard>

      {/* Cardápio Online / Site */}
      <IntegrationCard
        icon={<Globe className="h-7 w-7 text-blue-500" />}
        iconBg="bg-blue-500/10"
        name="Cardápio Online (Site)"
        description="Seu cardápio digital público acessível por qualquer cliente via link. Aceita pedidos online com PIX e cartão."
        status={siteConnected ? "ativo" : "disponivel"}
        badge={
          siteConnected ? (
            <StatusBadge color="success">
              <Check className="h-3 w-3" /> Ativo
            </StatusBadge>
          ) : (
            <StatusBadge color="neutral">Slug não configurado</StatusBadge>
          )
        }
      >
        {siteConnected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="font-semibold text-success">Cardápio online ativo!</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Link público da sua loja
              </Label>
              <div className="flex gap-2">
                <Input value={storeUrl} readOnly className="font-mono text-xs bg-muted/30" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(storeUrl, "site-link")}
                >
                  {copied === "site-link" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(storeUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link nas redes sociais, WhatsApp e perfil do Google.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/app/configuracoes">
                  <SettingsIcon className="h-4 w-4" /> Configurar loja
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(storeUrl, "_blank")}>
                <ExternalLink className="h-4 w-4" /> Ver loja
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning">Slug não configurado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acesse Configurações → Empresa e defina o nome único da sua loja para ativar o cardápio online.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/app/configuracoes">
                <SettingsIcon className="h-4 w-4" /> Configurar agora
              </Link>
            </Button>
          </div>
        )}
      </IntegrationCard>

      {/* QR Code / Mesa */}
      <IntegrationCard
        icon={<QrCode className="h-7 w-7 text-purple-500" />}
        iconBg="bg-purple-500/10"
        name="QR Code de Mesa"
        description="Gere QR codes únicos por mesa para que clientes façam pedidos diretamente da mesa, sem garçom."
        status="ativo"
        badge={
          <StatusBadge color="success">
            <Check className="h-3 w-3" /> Disponível
          </StatusBadge>
        }
      >
        <div className="space-y-4">
          <HowItWorks
            steps={[
              "Crie mesas em Configurações → Mesas (QR)",
              "Imprima o QR code e coloque nas mesas",
              "Clientes escaneiam e fazem pedidos direto pelo celular",
            ]}
          />
          <Button asChild size="sm" variant="outline">
            <Link to="/app/configuracoes">
              <QrCode className="h-4 w-4" /> Gerenciar Mesas
            </Link>
          </Button>
        </div>
      </IntegrationCard>

      {/* Balcão */}
      <IntegrationCard
        icon={<ShoppingBag className="h-7 w-7 text-orange-500" />}
        iconBg="bg-orange-500/10"
        name="Balcão / Presencial"
        description="Registre pedidos feitos pessoalmente no balcão ou por telefone diretamente no painel de pedidos."
        status="ativo"
        badge={
          <StatusBadge color="success">
            <Check className="h-3 w-3" /> Disponível
          </StatusBadge>
        }
      >
        <div className="space-y-4">
          <HowItWorks
            steps={[
              "Acesse o painel de Pedidos",
              "Crie um novo pedido manual com o canal "Balcão"",
              "O pedido entra na fila de produção normalmente",
            ]}
          />
          <Button asChild size="sm" variant="outline">
            <Link to="/app/pedidos">
              <ShoppingBag className="h-4 w-4" /> Ver Pedidos
            </Link>
          </Button>
        </div>
      </IntegrationCard>

      {/* iFood */}
      <IntegrationCard
        icon={
          <span className="text-2xl font-black text-[#EA1D2C]">iF</span>
        }
        iconBg="bg-[#EA1D2C]/10"
        name="iFood"
        description="Integração direta com a plataforma iFood para receber pedidos automaticamente no painel PediHub."
        status="em_breve"
        badge={
          <StatusBadge color="warning">
            <Clock className="h-3 w-3" /> Em breve
          </StatusBadge>
        }
      >
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Integração nativa com iFood em desenvolvimento</p>
            <p className="text-xs text-muted-foreground mt-1">
              Estamos trabalhando para integrar diretamente com a API do iFood. Em breve você poderá receber e gerenciar pedidos do iFood direto no PediHub.
            </p>
          </div>
        </div>
      </IntegrationCard>

      {/* Modal WhatsApp */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              Configurar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Informe o número de WhatsApp da sua loja. Os clientes poderão entrar em contato e você terá o número salvo para comunicações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">Número de WhatsApp</Label>
              <Input
                id="whatsapp-number"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="11999887766"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Apenas números, com DDD. Ex: 11999887766
              </p>
            </div>
            <div className="rounded-xl bg-[#25D366]/5 border border-[#25D366]/20 p-4 space-y-2">
              <p className="text-xs font-bold text-[#25D366] uppercase">Como funciona</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-[#25D366] shrink-0" />
                  Seu número ficará disponível para clientes entrarem em contato
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-[#25D366] shrink-0" />
                  Ao atualizar o status dos pedidos, você poderá notificar o cliente pelo WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-[#25D366] shrink-0" />
                  Compartilhe o link do cardápio pelo WhatsApp e os pedidos chegam no painel automaticamente
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveWhatsApp}
              disabled={saving || !whatsappNumber.trim()}
              className="bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              <MessageCircle className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function IntegrationCard({
  icon,
  iconBg,
  name,
  description,
  badge,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
  status: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-6 flex items-start gap-5 border-b border-border/50">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold">{name}</h3>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </article>
  );
}

function StatusBadge({
  color,
  children,
}: {
  color: "success" | "warning" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/15 text-warning",
    neutral: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[color]}`}
    >
      {children}
    </span>
  );
}

function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase">Como funciona</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
