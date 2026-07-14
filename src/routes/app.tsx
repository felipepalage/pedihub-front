import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";
import { getSettings, activateSubscription } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function SubscriptionBanner() {
  const { user } = useAuth();
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);

  useEffect(() => {
    if ((user as any)?.role === "SuperAdmin") return;
    getSettings()
      .then(s => { if (s.validUntil) setValidUntil(s.validUntil); })
      .catch(() => {});
  }, [(user as any)?.role]);

  if (!validUntil || (user as any)?.role === "SuperAdmin") return null;

  const daysLeft = Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000);
  if (daysLeft > 3) return null;

  const isExpired = daysLeft <= 0;

  const handleActivate = async () => {
    if (!tokenInput.trim()) return;
    setActivating(true);
    try {
      const result = await activateSubscription(tokenInput.trim());
      setValidUntil(result.validUntil);
      setShowTokenForm(false);
      setTokenInput("");
      toast.success("Assinatura ativada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Token inválido ou já utilizado.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className={`border-b px-4 py-2.5 ${isExpired ? "bg-destructive/10 border-destructive/30" : "bg-warning/10 border-warning/30"}`}>
      <div className="mx-auto max-w-[1400px] space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className={`flex items-center gap-2 text-sm font-medium ${isExpired ? "text-destructive" : "text-warning"}`}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              {isExpired
                ? "Sua assinatura expirou! Insira o token de ativação para continuar usando o PediHub."
                : `Sua assinatura expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}. Renove agora para não perder o acesso!`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://wa.me/5511967594753"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#20b757] transition-colors"
            >
              Suporte WhatsApp
            </a>
            <Button size="sm" variant={isExpired ? "destructive" : "default"} onClick={() => setShowTokenForm(v => !v)}>
              Inserir Token
            </Button>
          </div>
        </div>
        {showTokenForm && (
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Cole seu token de ativação..."
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="bg-background font-mono text-sm"
              onKeyDown={e => { if (e.key === "Enter") handleActivate(); }}
            />
            <Button onClick={handleActivate} disabled={activating || !tokenInput.trim()}>
              {activating ? "Ativando..." : "Ativar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Carregando sessao...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }



  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar />
        <SubscriptionBanner />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
