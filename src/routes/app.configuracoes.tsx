import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
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
  uploadMedia,
  getCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
  type LoyaltyProgram,
  type MerchantTable,
  type Coupon
} from "@/lib/api";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
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
  Ticket,
  Upload,
  Image as ImageIcon,
  Navigation
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
  deliveryRadius: number;
  autoAcceptOrders: boolean;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  pixKey: string;
  mercadoPagoAccessToken: string;
  whatsAppNumber: string;
  slug: string;
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
  deliveryRadius: 5,
  autoAcceptOrders: false,
  primaryColor: "#E53935",
  logoUrl: "",
  bannerUrl: "",
  pixKey: "",
  mercadoPagoAccessToken: "",
  whatsAppNumber: "",
  slug: "",
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5172";

function getImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function SettingsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loyalty, setLoyalty] = useState<LoyaltyProgram | null>(null);
  const [tables, setTables] = useState<MerchantTable[]>([]);
  const [newTableNum, setNewTableNum] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    type: "fixed",
    discountAmount: 0,
    minOrderValue: 0,
    isActive: true
  });

  const { user } = useAuth();
  const currentSlug = form.slug || user?.slug;

  useEffect(() => {
    Promise.all([getSettings(), getLoyaltyProgram(), getTables(), getCoupons()])
      .then(([settings, loyaltyData, tablesData, couponsData]) => {
        console.log("Settings from API:", settings);
        setForm({
          ...settings,
          averagePrepMinutes: String(settings.averagePrepMinutes),
          deliveryFeeBase: String(settings.deliveryFeeBase),
          minimumOrder: String(settings.minimumOrder),
          deliveryRadius: settings.deliveryRadius ?? 5,
          pixKey: settings.pixKey || "",
          mercadoPagoAccessToken: settings.mercadoPagoAccessToken || "",
          whatsAppNumber: settings.whatsAppNumber || "",
          slug: settings.slug || "",
        });
        setLoyalty(loyaltyData);
        setTables(tablesData);
        setCoupons(couponsData);
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
        deliveryRadius: form.deliveryRadius,
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

  const handleToggleCoupon = async (id: string) => {
    try {
      await toggleCoupon(id);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
      toast.success("Status do cupom atualizado!");
    } catch (err) {
      toast.error("Erro ao atualizar cupom.");
    }
  };

  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);

  const handleDeleteCoupon = async (id: string) => {
    if (deletingCouponId !== id) {
      setDeletingCouponId(id);
      setTimeout(() => setDeletingCouponId(null), 3000); // Reset after 3s
      return;
    }

    try {
      await deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success("Cupom removido!");
      setDeletingCouponId(null);
    } catch (err) {
      toast.error("Erro ao excluir cupom.");
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code) return toast.error("Informe o código.");
    if (!newCoupon.discountAmount || newCoupon.discountAmount <= 0) return toast.error("Informe o valor.");

    try {
      const created = await createCoupon(newCoupon);
      setCoupons(prev => [...prev, created]);
      setCouponModalOpen(false);
      setNewCoupon({ code: "", type: "fixed", discountAmount: 0, minOrderValue: 0, isActive: true });
      toast.success("Cupom criado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar cupom.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "bannerUrl") => {
     const file = e.target.files?.[0];
     if (!file) return;

     const loadingToast = toast.loading("Enviando imagem...");
     try {
       const { url } = await uploadMedia(file);
       setForm(prev => ({ ...prev, [field]: url }));
       toast.success("Imagem enviada com sucesso!", { id: loadingToast });
     } catch (err) {
       toast.error("Erro ao enviar imagem.", { id: loadingToast });
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
          <TabsTrigger value="integracao" className="gap-2"><Globe className="h-4 w-4" /> Integrações API</TabsTrigger>
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

            <div className="mt-4 rounded-2xl border bg-primary/5 p-4">
              <Label className="text-xs font-bold text-primary uppercase">Link da sua Loja Pública</Label>
              <div className="mt-2 flex gap-2">
                <Input 
                  readOnly 
                  value={currentSlug ? `${window.location.origin}/${currentSlug}` : "Carregando link..."} 
                  className="bg-background font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={!currentSlug}
                  onClick={() => {
                    if (currentSlug) {
                      navigator.clipboard.writeText(`${window.location.origin}/${currentSlug}`);
                      toast.success("Link copiado!");
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={!currentSlug}
                  onClick={() => {
                    if (currentSlug) {
                      window.open(`${window.location.origin}/${currentSlug}`, "_blank");
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground uppercase">Compartilhe este link com seus clientes para receber pedidos.</p>
            </div>

           <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
               <div className="col-span-full">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Identidade Visual</h3>
               </div>
               <div className="space-y-4">
                 <Label className="text-xs font-bold text-muted-foreground uppercase">Logo da Loja</Label>
                 <div className="flex items-center gap-4">
                   <div className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/20">
                     {form.logoUrl ? (
                       <img src={getImageUrl(form.logoUrl)} className="h-full w-full object-contain" />
                     ) : (
                       <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                     )}
                   </div>
                   <div className="flex-1">
                     <input 
                       type="file" 
                       id="logo-upload" 
                       className="hidden" 
                       accept="image/*"
                       onChange={(e) => handleFileUpload(e, "logoUrl")}
                     />
                     <Button type="button" variant="outline" size="sm" asChild>
                       <label htmlFor="logo-upload" className="cursor-pointer">
                         <Upload className="h-4 w-4 mr-2" /> Selecionar Logo
                       </label>
                     </Button>
                     <p className="text-[10px] text-muted-foreground mt-2">PNG ou JPG até 2MB</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <Label className="text-xs font-bold text-muted-foreground uppercase">Banner / Capa</Label>
                 <div className="flex flex-col gap-3">
                   <div className="h-20 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/20">
                     {form.bannerUrl ? (
                       <img src={getImageUrl(form.bannerUrl)} className="h-full w-full object-cover" />
                     ) : (
                       <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                     )}
                   </div>
                   <div className="flex items-center gap-3">
                     <input 
                       type="file" 
                       id="banner-upload" 
                       className="hidden" 
                       accept="image/*"
                       onChange={(e) => handleFileUpload(e, "bannerUrl")}
                     />
                     <Button type="button" variant="outline" size="sm" asChild>
                       <label htmlFor="banner-upload" className="cursor-pointer">
                         <Upload className="h-4 w-4 mr-2" /> Selecionar Banner
                       </label>
                     </Button>
                     <p className="text-[10px] text-muted-foreground">Formato paisagem (capa)</p>
                   </div>
                 </div>
               </div>

               <Field label="Cor Principal">
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={form.primaryColor} 
                    onChange={e => setForm({...form, primaryColor: e.target.value})} 
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={form.primaryColor} 
                    onChange={e => setForm({...form, primaryColor: e.target.value})} 
                    className="flex-1 font-mono"
                  />
                </div>
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

           <div className="rounded-2xl border bg-muted/20 p-4 space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Navigation className="h-4 w-4 text-primary" />
                 <Label className="text-base font-bold">Raio de Entrega</Label>
               </div>
               <span className="rounded-full bg-primary px-3 py-1 text-sm font-black text-primary-foreground">
                 {form.deliveryRadius} km
               </span>
             </div>
             <p className="text-sm text-muted-foreground">Distância máxima que você atende com delivery. Exibido na sua loja para os clientes.</p>
             <Slider
               min={1}
               max={50}
               step={1}
               value={[form.deliveryRadius]}
               onValueChange={([v]) => setForm({...form, deliveryRadius: v})}
               className="py-2"
             />
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>1 km</span>
               <span>25 km</span>
               <span>50 km</span>
             </div>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Cupons de Desconto</h3>
              <Button onClick={() => setCouponModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Cupom
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black tracking-tighter text-primary">{coupon.code}</span>
                        <Switch 
                          checked={coupon.isActive} 
                          onCheckedChange={() => handleToggleCoupon(coupon.id)}
                          className="scale-75"
                        />
                      </div>
                      <p className="text-sm font-medium">
                        {coupon.type === "fixed" ? `R$ ${coupon.discountAmount} OFF` : `${coupon.discountAmount}% OFF`}
                      </p>
                    </div>
                    <Button 
                      variant={deletingCouponId === coupon.id ? "destructive" : "ghost"} 
                      size={deletingCouponId === coupon.id ? "sm" : "icon"} 
                      className={deletingCouponId === coupon.id ? "h-8 px-2 text-[10px] font-bold" : "text-destructive h-8 w-8"} 
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      {deletingCouponId === coupon.id ? "CONFIRMAR" : <Trash className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                      Min: R$ {coupon.minOrderValue}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                      Usos: {coupon.usageCount}
                    </span>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl">
                  <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum cupom cadastrado.</p>
                </div>
              )}
            </div>

            <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cupom</DialogTitle>
                  <DialogDescription>Crie um código de desconto para seus clientes.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Código do Cupom</Label>
                    <Input 
                      placeholder="EX: BEMVINDO10" 
                      value={newCoupon.code} 
                      onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newCoupon.type}
                        onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                      >
                        <option value="fixed">Valor Fixo (R$)</option>
                        <option value="percentage">Porcentagem (%)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Valor do Desconto</Label>
                      <Input 
                        type="number" 
                        value={newCoupon.discountAmount} 
                        onChange={e => setNewCoupon({...newCoupon, discountAmount: parseFloat(e.target.value)})} 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor Mínimo do Pedido (R$)</Label>
                    <Input 
                      type="number" 
                      value={newCoupon.minOrderValue} 
                      onChange={e => setNewCoupon({...newCoupon, minOrderValue: parseFloat(e.target.value)})} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCouponModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateCoupon}>Criar Cupom</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
         </TabsContent>

        <TabsContent value="pagamentos" className="mt-6 space-y-6">
          <div className="rounded-2xl border p-6 bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Mercado Pago (Pagamento Online)</h3>
              {form.mercadoPagoAccessToken ? (
                <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                  <Check className="mr-1 h-3.5 w-3.5" /> Conectado e Ativo
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  Nao Conectado
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">Conecte sua conta para aceitar Cartão e PIX automático com liberação imediata.</p>
            
            {form.mercadoPagoAccessToken ? (
              <div className="flex flex-col gap-4 max-w-md">
                <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex items-center justify-between">
                   <div>
                     <p className="font-semibold text-success">Integração Funcional</p>
                     <p className="text-xs text-success/80">Sua loja já pode processar pagamentos online.</p>
                   </div>
                </div>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setForm({...form, mercadoPagoAccessToken: ""})}>
                  Desconectar Conta
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-md">
                 <Button className="bg-[#009EE3] hover:bg-[#0087c1] text-white font-bold h-12" onClick={() => window.open("https://www.mercadopago.com.br/settings/account/credentials", "_blank")}>
                   <Globe className="mr-2 h-5 w-5" /> Gerar Chave no Mercado Pago
                 </Button>
                 
                 <div className="mt-2 space-y-1.5">
                   <Label className="text-xs font-bold text-muted-foreground uppercase">Cole a Chave de Produção (Access Token) Aqui</Label>
                   <Input 
                     type="password"
                     value={form.mercadoPagoAccessToken} 
                     onChange={e => setForm({...form, mercadoPagoAccessToken: e.target.value})} 
                     placeholder="APP_USR-..." 
                     className="bg-muted/30 font-mono text-sm"
                   />
                 </div>
              </div>
            )}
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
                              <body style="display:flex;flex-direction:column;align-items:center;justify-center;height:100vh;font-family:sans-serif;">
                                <h1 style="font-size:3rem;margin-bottom:1rem;">MESA ${table.number}</h1>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.origin}/store/mesa/${table.id}`)}" style="width:400px;height:400px;border: 4px solid black;padding: 10px;border-radius: 20px;" />
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

        <TabsContent value="integracao" className="mt-6 space-y-6">
           <div className="rounded-2xl border p-6 bg-card shadow-sm">
             <h3 className="text-lg font-bold mb-2">Acesso à API - Token de Autenticação</h3>
             <p className="text-sm text-muted-foreground mb-6">Use seu token para fazer requisições à API do PEDIHUB. Sua senha é seu token de autenticação.</p>
             
             <div className="space-y-4">
               <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                 <p className="text-sm font-semibold mb-2">URL Base da API</p>
                 <div className="flex gap-2">
                   <input 
                     readOnly 
                     type="text"
                     value={`${API_URL}`}
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-mono"
                   />
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => {
                       navigator.clipboard.writeText(`${API_URL}`);
                       toast.success("URL copiada!");
                     }}
                   >
                     <Copy className="h-4 w-4" />
                   </Button>
                 </div>
               </div>

               <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                 <p className="text-sm font-semibold mb-2">Autenticação (Headers)</p>
                 <code className="text-xs bg-muted/50 p-3 rounded block font-mono overflow-x-auto mb-3">
                   Authorization: Bearer {user?.email}
                 </code>
                 <p className="text-xs text-muted-foreground">Inclua este header em todas suas requisições à API.</p>
               </div>

               <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                 <p className="text-sm font-semibold mb-3">Documentação de Endpoints</p>
                 <div className="space-y-2 text-sm">
                   <p><strong>Listar Pedidos:</strong></p>
                   <code className="text-xs bg-muted/50 p-2 rounded block font-mono">GET {API_URL}/api/orders</code>
                   
                   <p className="mt-4"><strong>Obter Detalhes do Pedido:</strong></p>
                   <code className="text-xs bg-muted/50 p-2 rounded block font-mono">GET {API_URL}/api/orders/{'{{orderId}}'}</code>
                   
                   <p className="mt-4"><strong>Atualizar Status do Pedido:</strong></p>
                   <code className="text-xs bg-muted/50 p-2 rounded block font-mono">PATCH {API_URL}/api/orders/{'{{orderId}}'}/status</code>
                   
                   <p className="mt-4"><strong>Criar um Pedido:</strong></p>
                   <code className="text-xs bg-muted/50 p-2 rounded block font-mono">POST {API_URL}/api/orders</code>
                 </div>
                 <Button variant="outline" size="sm" className="mt-4" asChild>
                   <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer">
                     Ver Documentação Completa →
                   </a>
                 </Button>
               </div>

               <div className="rounded-lg border border-info/20 bg-info/5 p-4">
                 <p className="text-sm font-semibold mb-2">Contato e Suporte</p>
                 <p className="text-xs text-muted-foreground mb-3">Para dúvidas sobre integração da API, entre em contato com o suporte técnico:</p>
                 <p className="text-xs"><strong>Email:</strong> dev@pedihub.com.br</p>
                 <p className="text-xs"><strong>Telefone:</strong> +55 11 98765-4321</p>
               </div>
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
