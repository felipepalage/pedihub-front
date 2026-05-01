import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  getSettings, 
  updateSettings, 
  getLoyaltyProgram, 
  updateLoyaltyProgram,
  getTables,
  createTable,
  deleteTable,
  type LoyaltyProgram,
  type MerchantTable
} from "@/lib/api";
import { 
  MessageCircle, 
  Eye, 
  Globe, 
  Copy, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building2, 
  Gift, 
  QrCode, 
  Award, 
  Plus, 
  Trash,
  Ticket
} from "lucide-react";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

type FormState = {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: string;
  averagePrepMinutes: string;
  deliveryFeeBase: string;
  minimumOrder: string;
  autoAcceptOrders: boolean;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  pixKey: string;
  mercadoPagoAccessToken: string;
  whatsAppNumber: string;
};

const initialForm: FormState = {
  companyName: "",
  cnpj: "",
  phone: "",
  email: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  openingHours: "",
  averagePrepMinutes: "35",
  deliveryFeeBase: "0",
  minimumOrder: "0",
  autoAcceptOrders: false,
  primaryColor: "#E53935",
  logoUrl: "",
  bannerUrl: "",
  whatsAppNumber: "",
};

function SettingsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loyalty, setLoyalty] = useState<LoyaltyProgram | null>(null);
  const [tables, setTables] = useState<MerchantTable[]>([]);
  const [newTableNum, setNewTableNum] = useState("");

  useEffect(() => {
    Promise.all([getSettings(), getLoyaltyProgram(), getTables()])
      .then(([settings, loyaltyData, tablesData]) => {
        setForm({
          ...settings,
          averagePrepMinutes: String(settings.averagePrepMinutes),
          deliveryFeeBase: String(settings.deliveryFeeBase),
          minimumOrder: String(settings.minimumOrder),
          pixKey: settings.pixKey || "",
          mercadoPagoAccessToken: settings.mercadoPagoAccessToken || "",
          whatsAppNumber: settings.whatsAppNumber || "",
        });
        setLoyalty(loyaltyData);
        setTables(tablesData);
      })
      .catch(() => toast.error("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, []);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        averagePrepMinutes: parseInt(form.averagePrepMinutes),
        deliveryFeeBase: parseFloat(form.deliveryFeeBase),
        minimumOrder: parseFloat(form.minimumOrder),
      });
      toast.success("Configuracoes salvas!");
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const saveLoyalty = async () => {
    if (!loyalty) return;
    setSaving(true);
    try {
      await updateLoyaltyProgram(loyalty);
      toast.success("Programa de fidelidade atualizado!");
    } catch (err) {
      toast.error("Erro ao salvar fidelidade.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTableNum) return;
    try {
      const created = await createTable(newTableNum);
      setTables([...tables, created]);
      setNewTableNum("");
      toast.success("Mesa adicionada!");
    } catch (err) {
      toast.error("Erro ao criar mesa.");
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await deleteTable(id);
      setTables(tables.filter(t => t.id !== id));
      toast.success("Mesa removida.");
    } catch (err) {
      toast.error("Erro ao remover mesa.");
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configuracoes</h1>
          <p className="text-muted-foreground">Personalize sua loja, pagamentos e fidelidade.</p>
        </div>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="empresa" className="gap-2"><Building2 className="h-4 w-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="endereco" className="gap-2"><MapPin className="h-4 w-4" /> Endereco</TabsTrigger>
          <TabsTrigger value="operacao" className="gap-2"><Phone className="h-4 w-4" /> Operacao</TabsTrigger>
          <TabsTrigger value="pagamentos" className="gap-2"><Globe className="h-4 w-4" /> Pagamentos</TabsTrigger>
          <TabsTrigger value="cupons" className="gap-2"><Ticket className="h-4 w-4" /> Cupons</TabsTrigger>
          <TabsTrigger value="fidelidade" className="gap-2"><Award className="h-4 w-4" /> Fidelidade</TabsTrigger>
          <TabsTrigger value="mesas" className="gap-2"><QrCode className="h-4 w-4" /> Mesas (QR)</TabsTrigger>
        </TabsList>

         <TabsContent value="empresa" className="mt-6 space-y-4">
           <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da Empresa">
                <Input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
              </Field>
              <Field label="CNPJ">
                <Input value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} />
              </Field>
           </div>
           <Button onClick={saveGeneral} disabled={saving}>Salvar Empresa</Button>
         </TabsContent>

         <TabsContent value="endereco" className="mt-6 space-y-4">
           <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP"><Input value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})} /></Field>
              <Field label="Rua"><Input value={form.street} onChange={e => setForm({...form, street: e.target.value})} /></Field>
              <Field label="Número"><Input value={form.number} onChange={e => setForm({...form, number: e.target.value})} /></Field>
              <Field label="Bairro"><Input value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} /></Field>
              <Field label="Cidade"><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} disabled /></Field>
              <Field label="Estado"><Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} disabled /></Field>
           </div>
           <Button onClick={saveGeneral} disabled={saving}>Salvar Endereço</Button>
         </TabsContent>

         <TabsContent value="operacao" className="mt-6 space-y-4">
           <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Horário de Funcionamento"><Input value={form.openingHours} onChange={e => setForm({...form, openingHours: e.target.value})} placeholder="Ex: Seg a Sex, 18h as 23h" /></Field>
              <Field label="Tempo Médio (minutos)"><Input type="number" value={form.averagePrepMinutes} onChange={e => setForm({...form, averagePrepMinutes: e.target.value})} /></Field>
              <Field label="Taxa de Entrega (R$)"><Input type="number" step="0.5" value={form.deliveryFeeBase} onChange={e => setForm({...form, deliveryFeeBase: e.target.value})} /></Field>
              <Field label="Pedido Mínimo (R$)"><Input type="number" step="0.5" value={form.minimumOrder} onChange={e => setForm({...form, minimumOrder: e.target.value})} /></Field>
           </div>
           <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20">
             <div>
               <Label className="text-base font-bold">Aceite Automático</Label>
               <p className="text-sm text-muted-foreground">Aceitar pedidos automaticamente quando a loja estiver aberta.</p>
             </div>
             <Switch checked={form.autoAcceptOrders} onCheckedChange={v => setForm({...form, autoAcceptOrders: v})} />
           </div>
           <Button onClick={saveGeneral} disabled={saving}>Salvar Operação</Button>
         </TabsContent>

         <TabsContent value="cupons" className="mt-6 space-y-4">
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-muted/10 border-dashed">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold">Gerenciamento de Cupons</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">Crie cupons de desconto, defina validade e regras de uso para atrair mais clientes. Esta funcionalidade estará liberada na próxima atualização da plataforma.</p>
            <Button variant="outline" className="mt-6 pointer-events-none opacity-50">Em Breve</Button>
          </div>
         </TabsContent>

        <TabsContent value="pagamentos" className="mt-6 space-y-6">
          <div className="rounded-2xl border p-6 bg-card shadow-sm">
            <h3 className="text-lg font-bold mb-4">Mercado Pago (Pagamento Online)</h3>
            <p className="text-sm text-muted-foreground mb-6">Conecte sua conta para aceitar Cartão e PIX automático com liberação imediata.</p>
            
            <div className="flex flex-col gap-4 max-w-md">
               <Button className="bg-[#009EE3] hover:bg-[#0087c1] text-white font-bold h-12" onClick={() => window.open("https://www.mercadopago.com.br/", "_blank")}>
                 <Globe className="mr-2 h-5 w-5" /> Conectar com Mercado Pago
               </Button>
               {/* Removido input de access token que confundia o lojista */}
            </div>
          </div>

          <div className="rounded-2xl border p-6 bg-card shadow-sm">
            <h3 className="text-lg font-bold mb-4">PIX Direto (Transferência)</h3>
            <Field label="Chave PIX">
              <Input value={form.pixKey} onChange={e => setForm({...form, pixKey: e.target.value})} placeholder="CPF, E-mail ou Chave Aleatoria" />
            </Field>
          </div>
          <Button onClick={saveGeneral} disabled={saving}>Salvar Pagamentos</Button>
        </TabsContent>

        <TabsContent value="fidelidade" className="mt-6 space-y-6">
           <div className="rounded-2xl border p-6 bg-card shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-bold">Programa de Fidelidade</h3>
                   <p className="text-sm text-muted-foreground">Retenha seus clientes com recompensas por pontos.</p>
                </div>
                <Switch checked={loyalty?.isActive} onCheckedChange={val => setLoyalty(l => l ? {...l, isActive: val} : null)} />
             </div>

             <div className="grid gap-6 sm:grid-cols-3">
                <Field label="Pontos por R$ 1,00">
                   <Input type="number" value={loyalty?.pointsPerReal} onChange={e => setLoyalty(l => l ? {...l, pointsPerReal: parseFloat(e.target.value)} : null)} />
                </Field>
                <Field label="Min. para Resgate">
                   <Input type="number" value={loyalty?.minPointsToRedeem} onChange={e => setLoyalty(l => l ? {...l, minPointsToRedeem: parseFloat(e.target.value)} : null)} />
                </Field>
                <Field label="Valor do Desconto (R$)">
                   <Input type="number" value={loyalty?.redeemValue} onChange={e => setLoyalty(l => l ? {...l, redeemValue: parseFloat(e.target.value)} : null)} />
                </Field>
             </div>
           </div>
           <Button onClick={saveLoyalty} disabled={saving}>Salvar Fidelidade</Button>
        </TabsContent>

        <TabsContent value="mesas" className="mt-6 space-y-6">
           <div className="rounded-2xl border p-6 bg-card shadow-sm">
             <h3 className="text-lg font-bold mb-4">Gerenciamento de Mesas</h3>
             <div className="flex gap-4 mb-8 max-w-sm">
                <Input value={newTableNum} onChange={e => setNewTableNum(e.target.value)} placeholder="Numero da mesa" />
                <Button onClick={handleAddTable}><Plus className="h-4 w-4" /> Add</Button>
             </div>

             <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {tables.map(table => (
                   <div key={table.id} className="flex flex-col items-center gap-3 rounded-2xl border p-4 bg-muted/20">
                      <div className="h-32 w-32 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                         <QrCode className="h-24 w-24 text-black" />
                      </div>
                      <div className="flex items-center justify-between w-full">
                         <span className="font-bold">Mesa {table.number}</span>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => table.id && handleDeleteTable(table.id)}>
                            <Trash className="h-4 w-4" />
                         </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-bold" onClick={() => {
                        const printWindow = window.open('', '', 'width=600,height=800');
                        if(printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head><title>Imprimir QR - Mesa ${table.number}</title></head>
                              <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                                <h1 style="font-size:3rem;margin-bottom:1rem;">MESA ${table.number}</h1>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`http://localhost:5174/store/mesa/${table.id}`)}" style="width:400px;height:400px;border: 4px solid black;padding: 10px;border-radius: 20px;" />
                                <p style="margin-top:2rem;font-size:1.5rem;color:#666;text-align:center;">Escaneie o código<br/>para fazer seu pedido</p>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.focus();
                          setTimeout(() => {
                            printWindow.print();
                            printWindow.close();
                          }, 1000);
                        }
                      }}>Imprimir QR</Button>
                   </div>
                ))}
             </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}
