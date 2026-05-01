import { useState } from "react";
import { Lock, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { activateSubscription } from "@/lib/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function SubscriptionLockScreen() {
  const { user, logout } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Por favor, insira um token válido.");
      return;
    }

    setLoading(true);
    try {
      await activateSubscription(token);
      toast.success("Plano ativado com sucesso! Atualizando página...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Falha ao ativar token.");
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá, sou do estabelecimento *${user?.merchantName}* e gostaria de assinar a plataforma PediHub. Pode me ajudar?`);
    window.open(`https://wa.me/5511980843514?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background rounded-xl border shadow-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-destructive" />
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Período de Teste Expirado</h2>
            <p className="text-muted-foreground">
              Os seus 7 dias gratuitos chegaram ao fim. Para continuar usando o PediHub e recebendo seus pedidos, é necessário ativar a sua assinatura.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Já tem um token?</h3>
            <form onSubmit={handleActivate} className="space-y-3">
              <div className="space-y-1 text-left">
                <Label htmlFor="token">Token de Ativação</Label>
                <Input
                  id="token"
                  placeholder="Cole aqui o seu código"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ativando..." : "Ativar Plano"} <CheckCircle2 className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Quer assinar?</h3>
            <Button variant="outline" className="w-full border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={handleWhatsApp}>
              Falar com Comercial no WhatsApp
            </Button>
          </div>

          <div className="pt-2">
            <Button variant="ghost" className="text-muted-foreground w-full" onClick={() => logout()}>
              <LogOut className="mr-2 w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
