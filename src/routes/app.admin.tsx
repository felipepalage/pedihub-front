import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Plus, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getAdminMerchants, 
  deleteAdminMerchant,
  AdminMerchant 
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMerchantId, setDeletingMerchantId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const merchantsData = await getAdminMerchants();
      setMerchants(merchantsData);
    } catch (err: any) {
      toast.error(err.message || "Falha ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  const handleDeleteMerchant = async (id: string) => {
    if (deletingMerchantId !== id) {
      setDeletingMerchantId(id);
      setTimeout(() => setDeletingMerchantId(null), 4000); // Reset after 4s
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


        <div className="mt-6">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="text-lg font-semibold">Lojistas Cadastrados ({merchants.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Empresa</th>
                    <th className="px-6 py-4 font-medium">CNPJ</th>
                    <th className="px-6 py-4 font-medium">Cadastro</th>
                    <th className="px-6 py-4 font-medium">Status do Acesso</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{merchant.companyName}</td>
                      <td className="px-6 py-4 font-mono">{merchant.cnpj}</td>
                      <td className="px-6 py-4">{format(new Date(merchant.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                      <td className="px-6 py-4">
                        {merchant.status !== "ativo" ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            Fechado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                            Liberado
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
                          {deletingMerchantId === merchant.id ? "CLIQUE PARA CONFIRMAR EXCLUSÃO" : "Excluir"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
}
