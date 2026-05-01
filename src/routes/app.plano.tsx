import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, CheckCircle2, AlertTriangle, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { activateSubscription } from "@/lib/api";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/plano")({
  component: PlanoPage,
});

function PlanoPage() {
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const validUntil = user?.validUntil ? new Date(user.validUntil) : new Date();
  const daysRemaining = differenceInDays(validUntil, new Date());
  
  const isExpired = daysRemaining < 0;
  const isWarning = daysRemaining >= 0 && daysRemaining <= 7;
  
  let statusColor = "text-green-600 dark:text-green-500";
  let statusBg = "bg-green-500/10";
  let statusIcon = <CheckCircle2 className="w-8 h-8 text-green-600" />;
  
  if (isExpired) {
    statusColor = "text-destructive";
    statusBg = "bg-destructive/10";
    statusIcon = <AlertTriangle className="w-8 h-8 text-destructive" />;
  } else if (isWarning) {
    statusColor = "text-yellow-600 dark:text-yellow-500";
    statusBg = "bg-yellow-500/10";
    statusIcon = <Clock className="w-8 h-8 text-yellow-600" />;
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Por favor, insira um token válido.");
      return;
    }

    setLoading(true);
    try {
      await activateSubscription(token);
      toast.success("Plano ativado com sucesso! Atualizando sua assinatura...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Falha ao ativar token.");
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá, sou do estabelecimento *${user?.merchantName}* e gostaria de renovar/assinar a plataforma PediHub. Pode me ajudar com o token?`);
    window.open(`https://wa.me/5511980843514?text=${message}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Seu plano
        </h1>
        <p className="text-muted-foreground">Gerencie a sua assinatura e ative novos tokens.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-6">
          <h2 className="text-lg font-semibold border-b pb-4">Status da Assinatura</h2>
          
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${statusBg}`}>
              {statusIcon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Vencimento do Plano</p>
              <h3 className={`text-2xl font-bold ${statusColor}`}>
                {isExpired ? "Expirado" : `${daysRemaining} dias restantes`}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Válido até {format(validUntil, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground">
            <p>O seu plano atual é o <strong>{user?.plan}</strong>. Você tem acesso completo a todas as ferramentas do PediHub enquanto a sua assinatura estiver ativa.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-6">
          <h2 className="text-lg font-semibold border-b pb-4">Renovar ou Ativar Plano</h2>
          
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token de Ativação</Label>
              <Input
                id="token"
                placeholder="Insira o seu código de 8 caracteres"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                className="font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                Cada token adiciona automaticamente o tempo equivalente contratado ao seu limite atual.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : "Ativar Token"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Não tem um token?</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/20" 
            onClick={handleWhatsApp}
          >
            <MessageCircle className="mr-2 w-5 h-5" />
            Falar com o Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}
