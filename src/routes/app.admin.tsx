import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Plus, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAdminMerchants,
  getAdminTokens,
  createAdminToken,
  deleteAdminMerchant,
  type AdminMerchant,
  type ActivationToken,
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [tokens, setTokens] = useState<ActivationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingToken, setCreatingToken] = useState(false);
  const [deletingMerchantId, setDeletingMerchantId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [merchantsData, tokensData] = await Promise.all([
        getAdminMerchants(),
        getAdminTokens(),
      ]);
      setMerchants(merchantsData);
      setTokens(tokensData);
    } catch (err: any) {
      toast.error(err.message || "Falha ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateToken = async (months: number) => {
    setCreatingToken(true);
    try {
      const newToken = await createAdminToken(months);
      toast.success(`Token de ${months} mês(es) criado com sucesso!`);
      setTokens((prev) => [newToken, ...prev]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar token.");
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteMerchant = async (id: string) => {
    if (deletingMerchantId !== id) {
      setDeletingMerchantId(id);
      setTimeout(() => setDeletingMerchantId(null), 4000);
      return;
    }

    try {
      await deleteAdminMerchant(id);
      toast.success("Lojista excluído com sucesso.");
      setDeletingMerchantId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir lojista.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const safeFormat = (dateStr: string | null | undefined, fmt: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return format(d, fmt, { locale: ptBR });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando painel do administrador...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-purple-900 dark:text-purple-400">Painel do Administrador</h1>
          <p className="text-muted-foreground">Gestão exclusiva do SuperAdmin: Lojistas e Tokens.</p>
        </div>
      </div>

      <Tabs defaultValue="lojistas">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="lojistas">Lojistas ({merchants.length})</TabsTrigger>
          <TabsTrigger value="tokens">Tokens de Ativação ({tokens.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lojistas" className="mt-6">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h2 className="text-lg font-semibold">Lojistas Cadastrados ({merchants.length})</h2>
              <p className="text-sm text-muted-foreground mt-1">Gerencie o acesso e validade de cada estabelecimento.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Empresa</th>
                    <th className="px-6 py-4 font-medium">CNPJ</th>
                    <th className="px-6 py-4 font-medium">Cadastro</th>
                    <th className="px-6 py-4 font-medium">Válido até</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {merchants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">Nenhum lojista cadastrado.</td>
                    </tr>
                  )}
                  {merchants.map((merchant) => {
                    const validUntil = merchant.validUntil ? new Date(merchant.validUntil) : null;
                    const isExpired = validUntil ? validUntil < new Date() : true;

                    return (
                      <tr key={merchant.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold">{merchant.companyName}</td>
                        <td className="px-6 py-4 font-mono text-xs">{merchant.cnpj}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {safeFormat(merchant.createdAt, "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          {validUntil ? (
                            <span className={isExpired ? "text-destructive font-semibold" : "text-foreground"}>
                              {safeFormat(merchant.validUntil, "dd/MM/yyyy")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                              Expirado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                              <CheckCircle2 className="h-3 w-3" /> Liberado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={deletingMerchantId === merchant.id ? "destructive" : "ghost"}
                            size="sm"
                            className={deletingMerchantId === merchant.id ? "font-bold animate-pulse" : "text-destructive hover:bg-destructive/10"}
                            onClick={() => handleDeleteMerchant(merchant.id)}
                          >
                            {deletingMerchantId === merchant.id ? "CONFIRMAR EXCLUSÃO" : "Excluir"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tokens" className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Tokens de Ativação</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gere um token e envie ao cliente. Ele ativa inserindo na plataforma — cada token libera acesso por N meses (R$97/mês).
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" onClick={() => handleCreateToken(1)} disabled={creatingToken}>
                  <Plus className="w-4 h-4 mr-1" /> 1 Mês
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleCreateToken(3)} disabled={creatingToken}>
                  <Plus className="w-4 h-4 mr-1" /> 3 Meses
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleCreateToken(6)} disabled={creatingToken}>
                  <Plus className="w-4 h-4 mr-1" /> 6 Meses
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Código</th>
                    <th className="px-6 py-4 font-medium">Meses</th>
                    <th className="px-6 py-4 font-medium">Gerado em</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tokens.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-muted-foreground">Nenhum token gerado ainda.</td>
                    </tr>
                  )}
                  {tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-primary font-mono tracking-widest text-sm">
                            {token.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(token.code)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copiar código"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{token.months} {token.months === 1 ? "mês" : "meses"}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {safeFormat(token.createdAt, "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="px-6 py-4">
                        {token.isUsed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            Usado {token.usedAt ? `em ${safeFormat(token.usedAt, "dd/MM/yyyy")}` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                            Disponível
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
