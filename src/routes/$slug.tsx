import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  getStoreInfo, 
  getStoreProducts, 
  placeStoreOrder,
  validateCoupon,
  type StorePublic, 
  type StoreProduct, 
  type StoreCartItem,
  type PlaceOrderPayload,
  type Coupon
} from "@/lib/api";
import { isValidPhone } from "@/lib/validators";
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Plus, 
  Minus, 
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store as StoreIcon,
  CreditCard,
  Banknote,
  QrCode,
  Utensils,
  ShoppingBasket,
  Ticket,
  Percent,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$slug")({
  component: StorePage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5172";

function getImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function StorePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StorePublic | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    type: "delivery" as "delivery" | "pickup",
    payment: "pix" as "pix" | "cartao" | "dinheiro",
    changeFor: "",
    zipCode: "",
    street: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
    referencePoint: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [info, items] = await Promise.all([
          getStoreInfo(slug),
          getStoreProducts(slug)
        ]);
        setStore(info);
        setProducts(items);
      } catch (err) {
        console.error(err);
        setStore(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category || "Geral")));
    return cats;
  }, [products]);

  const addToCart = (product: StoreProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        unitPrice: product.price 
      }];
    });
    toast.success(`${product.name} adicionado!`, { duration: 1000 });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing?.quantity === 1) {
        return prev.filter(item => item.productId !== productId);
      }
      return prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const deliveryFee = formData.type === "delivery" ? (store?.deliveryFeeBase || 0) : 0;
  
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "fixed") return appliedCoupon.discountAmount;
    return (cartTotal * appliedCoupon.discountAmount) / 100;
  }, [appliedCoupon, cartTotal]);

  const finalTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const coupon = await validateCoupon(slug, couponInput);
      if (cartTotal < coupon.minOrderValue) {
        toast.error(`Pedido mínimo para este cupom é ${fmt.format(coupon.minOrderValue)}`);
        return;
      }
      setAppliedCoupon(coupon);
      toast.success("Cupom aplicado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Cupom inválido.");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (formData.type === "delivery" && formData.zipCode.replace(/\D/g, "").length !== 8) {
      toast.error("CEP invalido. Por favor, digite os 8 numeros corretos.");
      return;
    }

    if (!isValidPhone(formData.customerPhone)) {
      toast.error("O numero de WhatsApp informado e invalido. Por favor, informe um DDD e numero validos.");
      return;
    }

    if (formData.payment === "pix" && !pixModalOpen) {
      setPixModalOpen(true);
      return;
    }

    setOrderLoading(true);
    try {
      const payload: PlaceOrderPayload = {
        ...formData,
        changeFor: formData.payment === "dinheiro" ? Number(formData.changeFor) : undefined,
        items: cart,
        couponCode: appliedCoupon?.code
      };
      const res = await placeStoreOrder(slug, payload);

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }

      setOrderSuccess(res.orderNumber);
      setCart([]);
      setCheckoutOpen(false);
      navigate({ 
        to: "/$slug/order/$orderNumber", 
        params: { slug, orderNumber: res.orderNumber.toString() } 
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar pedido.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Loja não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O link que você acessou pode estar incorreto ou a loja foi desativada.</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/login"}>
          Sou Lojista
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 lg:pb-0">
      <style>{`
        :root {
          --primary: ${store.primaryColor || "#E53935"};
        }
      `}</style>
      {/* Header / Banner */}
      <div className="relative h-48 w-full bg-muted lg:h-64">
        {store.bannerUrl ? (
          <img src={getImageUrl(store.bannerUrl)} alt="Banner" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#1F1F1F] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <h1 className="text-white/20 text-6xl font-black tracking-tighter select-none">PEDIHUB</h1>
          </div>
        )}
        <div className="absolute inset-0 bg-black/10" />
        
        {/* PediHub Watermark */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 backdrop-blur-md">
          <span className="text-[10px] font-medium text-white/70">Plataforma</span>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded bg-primary p-0.5">
              <Utensils className="h-full w-full text-white" />
            </div>
            <span className="text-xs font-bold tracking-tighter text-white">PEDIHUB</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Store Info Card */}
        <div className="relative -mt-16 flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-xl md:flex-row md:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-white shadow-lg md:h-32 md:w-32 mx-auto md:mx-0 relative group">
            {store.logoUrl ? (
              <img src={getImageUrl(store.logoUrl)} alt={store.companyName} className="h-full w-full object-contain p-2" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-primary-foreground uppercase">
                {store.companyName.charAt(0)}
              </div>
            )}
            
            {/* Logo Watermark Badge */}
            <div className="absolute -bottom-1 -right-1 rounded-lg bg-white p-1 shadow-md border border-border">
              <div className="h-5 w-5 rounded-md bg-primary p-0.5">
                <Utensils className="h-full w-full text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">{store.companyName}</h1>
              <Badge variant="success">ABERTO AGORA</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {store.openingHours}
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Frete: {fmt.format(store.deliveryFeeBase)}
              </div>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" /> Mínimo: {fmt.format(store.minimumOrder)}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Navigation (Sticky) */}
        <div className="sticky top-0 z-40 -mx-4 bg-background/80 px-4 py-4 backdrop-blur-md border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button variant="default" size="sm" className="shrink-0 rounded-full px-6">Tudo</Button>
            {categories.map(cat => (
              <Button key={cat} variant="outline" size="sm" className="shrink-0 rounded-full px-6 hover:bg-primary/10 hover:text-primary border-primary/20">{cat}</Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row pb-32">
          <div className="flex-1 space-y-10">
            {categories.map(cat => (
              <section key={cat} className="space-y-5">
                <h2 className="text-xl font-black tracking-tight border-l-4 border-primary pl-4">{cat}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.filter(p => (p.category || "Geral") === cat).map(product => (
                    <div 
                      key={product.id} 
                      className="group relative flex gap-4 rounded-3xl border bg-card p-3 transition-all hover:shadow-xl hover:border-primary/30 cursor-pointer active:scale-[0.98]"
                      onClick={() => addToCart(product)}
                    >
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-inner">
                        {product.image && product.image.length > 5 ? (
                          <img src={getImageUrl(product.image)} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center opacity-20">
                            <Utensils className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted-foreground">{product.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-black text-primary text-lg">{fmt.format(product.price)}</span>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-9 w-9 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Desktop Cart Summary */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border bg-card p-6 shadow-lg">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="h-5 w-5" /> Seu Carrinho
              </h2>
              <div className="mt-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
                ) : (
                  <>
                    <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-2">
                      {cart.map(item => (
                        <div key={item.productId} className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{fmt.format(item.unitPrice)} cada</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => removeFromCart(item.productId)} className="rounded-full p-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.productId, name: item.name, price: item.unitPrice } as any)} className="rounded-full p-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{fmt.format(cartTotal)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                          <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> Cupom ({appliedCoupon.code})</span>
                          <span>-{fmt.format(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{fmt.format(finalTotal)}</span>
                      </div>
                      
                      {!appliedCoupon ? (
                        <div className="flex gap-2 mt-4">
                          <Input 
                            placeholder="Cupom de desconto" 
                            value={couponInput} 
                            onChange={e => setCouponInput(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                            Aplicar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-4 rounded-xl bg-green-500/10 p-2 text-xs text-green-700">
                          <span className="font-bold">Cupom aplicado!</span>
                          <button onClick={removeCoupon} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </div>
                      )}

                      <Button className="w-full mt-4" size="lg" onClick={() => setCheckoutOpen(true)}>Finalizar Pedido</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && !checkoutOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4 lg:hidden">
          <Button 
            className="h-14 w-full justify-between rounded-full px-6 shadow-2xl" 
            size="lg"
            onClick={() => setCheckoutOpen(true)}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
              <span>Ver Carrinho</span>
            </div>
            <span className="font-bold">{fmt.format(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>Preencha os dados abaixo para enviar seu pedido para a loja.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOrder} className="space-y-6 py-4">
            {/* Delivery/Pickup Toggle */}
            <div className="space-y-3">
              <Label>Como deseja receber seu pedido?</Label>
              <RadioGroup 
                defaultValue="delivery" 
                value={formData.type} 
                onValueChange={(v: "delivery" | "pickup") => setFormData(p => ({ ...p, type: v }))}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                  <Label
                    htmlFor="delivery"
                    className="flex flex-col items-center justify-between rounded-2xl border-2 bg-card p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                  >
                    <Truck className="mb-2 h-6 w-6" />
                    <span className="font-bold">Delivery</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                  <Label
                    htmlFor="pickup"
                    className="flex flex-col items-center justify-between rounded-2xl border-2 bg-card p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                  >
                    <StoreIcon className="mb-2 h-6 w-6" />
                    <span className="font-bold">Retirada</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Address Details (if delivery) */}
            {formData.type === "delivery" && (
              <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input 
                      id="zipCode" 
                      placeholder="00000-000" 
                      value={formData.zipCode} 
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => ({ ...p, zipCode: val }));
                        if (val.replace(/\D/g, "").length === 8) fetchAddress(val);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" value={formData.addressNumber} onChange={e => setFormData(p => ({ ...p, addressNumber: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="street">Rua</Label>
                  <Input id="street" value={formData.street} onChange={e => setFormData(p => ({ ...p, street: e.target.value }))} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" value={formData.neighborhood} onChange={e => setFormData(p => ({ ...p, neighborhood: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} disabled />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complement">Complemento / Referência</Label>
                  <Input id="complement" placeholder="Ex: Apto 22, Bloco B" value={formData.complement} onChange={e => setFormData(p => ({ ...p, complement: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu Nome</Label>
                <Input id="name" value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" placeholder="(00) 00000-0000" value={formData.customerPhone} onChange={e => setFormData(p => ({ ...p, customerPhone: e.target.value }))} required />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Forma de Pagamento (na entrega)</Label>
              <RadioGroup 
                value={formData.payment} 
                onValueChange={(v: any) => setFormData(p => ({ ...p, payment: v }))}
                className={cn("grid gap-2", store.mercadoPagoActive ? "grid-cols-2" : "grid-cols-3")}
              >
                {store.mercadoPagoActive && (
                  <div className="col-span-2">
                    <RadioGroupItem value="mercado_pago_online" id="p-mp" className="peer sr-only" />
                    <Label htmlFor="p-mp" className="flex items-center justify-center gap-3 rounded-xl border-2 p-4 hover:bg-muted peer-data-[state=checked]:border-[#009EE3] peer-data-[state=checked]:bg-[#009EE3]/5 cursor-pointer transition-all">
                      <Globe className="h-5 w-5 text-[#009EE3]" />
                      <div className="text-left">
                        <p className="text-sm font-bold">Pagar Online Agora</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Cartão ou PIX via Mercado Pago</p>
                      </div>
                    </Label>
                  </div>
                )}
                <div>
                  <RadioGroupItem value="pix" id="p-pix" className="peer sr-only" />
                  <Label htmlFor="p-pix" className="flex flex-col items-center gap-2 rounded-xl border p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs font-bold">Pix</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="cartao" id="p-card" className="peer sr-only" />
                  <Label htmlFor="p-card" className="flex flex-col items-center gap-2 rounded-xl border p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-bold">Cartão</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dinheiro" id="p-cash" className="peer sr-only" />
                  <Label htmlFor="p-cash" className="flex flex-col items-center gap-2 rounded-xl border p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs font-bold">Dinheiro</span>
                  </Label>
                </div>
              </RadioGroup>
              
              {formData.payment === "dinheiro" && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="change">Precisa de troco para quanto?</Label>
                  <Input 
                    id="change" 
                    type="number" 
                    placeholder="Ex: 50" 
                    value={formData.changeFor} 
                    onChange={e => setFormData(p => ({ ...p, changeFor: e.target.value }))} 
                  />
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="rounded-2xl border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Produtos</span>
                <span>{fmt.format(cartTotal)}</span>
              </div>
              {formData.type === "delivery" && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxa de Entrega</span>
                  <span>{fmt.format(store.deliveryFeeBase)}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Desconto ({appliedCoupon.code})</span>
                  <span>-{fmt.format(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Total a pagar</span>
                <span className="text-primary">{fmt.format(finalTotal)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 text-lg" disabled={orderLoading}>
                {orderLoading ? "Enviando Pedido..." : "Confirmar e Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={orderSuccess !== null} onOpenChange={() => setOrderSuccess(null)}>
        <DialogContent className="max-w-sm text-center py-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold">Pedido Enviado!</h2>
          <p className="mt-2 text-muted-foreground">
            Seu pedido **#{orderSuccess}** foi recebido pela loja e já está sendo processado.
          </p>
          <Button className="mt-8 w-full" variant="outline" onClick={() => setOrderSuccess(null)}>
            Voltar para a loja
          </Button>
        </DialogContent>
      </Dialog>

      {/* Pix Payment Modal */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-sm text-center py-8">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Pagamento via Pix</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm border">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(store.pixKey || "")}`} 
                  alt="QR Code Pix"
                  className="h-40 w-40"
                />
              </div>
              <p className="text-sm font-bold">Escaneie o QR Code</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Copie a chave abaixo para pagar:</p>
              <div className="flex items-center gap-2 rounded-xl border bg-muted p-3">
                <code className="flex-1 overflow-hidden text-ellipsis text-xs font-bold">{store.pixKey || "Chave não cadastrada"}</code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0" 
                  onClick={() => {
                    navigator.clipboard.writeText(store.pixKey);
                    toast.success("Chave Pix copiada!");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-yellow-500/10 p-4 text-xs text-yellow-600 font-medium">
              Apos o pagamento, clique no botao abaixo para enviar seu pedido para a cozinha.
            </div>

            <Button className="w-full h-12" onClick={handleSubmitOrder} disabled={orderLoading}>
              {orderLoading ? "Enviando..." : "Ja paguei, enviar pedido"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !checkoutOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
          <Button 
            className="h-14 w-full rounded-2xl shadow-2xl shadow-primary/40 px-6 justify-between text-lg font-black"
            onClick={() => setCheckoutOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
              <span>Ver Carrinho</span>
            </div>
            <span>{fmt.format(cartTotal)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
