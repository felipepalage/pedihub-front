import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  getStoreInfo,
  getStoreProducts,
  getStoreOrder,
  getStoreLoyaltyBalance,
  placeStoreOrder,
  validateCoupon,
  getImageUrl,
  type StorePublic,
  type StoreProduct,
  type StoreCartItem,
  type PlaceOrderPayload,
  type StoreLoyaltyBalance,
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
  Globe,
  Navigation,
  ExternalLink,
  Copy,
  Award,
  Star,
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

function StorePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  // Detect table mode from ?mesa=X URL param
  const mesaNumber = useMemo(() => new URLSearchParams(window.location.search).get("mesa") ?? "", []);
  const isMesa = mesaNumber !== "";

  const [store, setStore] = useState<StorePublic | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const submittingRef = useRef(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCodeBase64?: string;
    copyPaste?: string;
    staticKey?: string;
    orderNumber: number;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState<StoreLoyaltyBalance | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    type: (isMesa ? "mesa" : "delivery") as "delivery" | "pickup" | "mesa",
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
    note: "",
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

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category || "Geral")));
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const visibleCategories = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter(cat =>
      filteredProducts.some(p => (p.category || "Geral") === cat)
    );
  }, [categories, filteredProducts, search]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const updateItemObservation = (productId: string, observation: string) => {
    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, observation } : item
    ));
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

  // Poll order status when showing dynamic PIX modal
  useEffect(() => {
    if (!pixData?.qrCodeBase64 || !pixModalOpen) return;
    const orderNum = pixData.orderNumber;
    const interval = setInterval(async () => {
      try {
        const order = await getStoreOrder(slug, orderNum);
        if (order.status !== "novo") {
          clearInterval(interval);
          setPixModalOpen(false);
          navigate({ to: "/pedido/$slug/$orderNumber", params: { slug, orderNumber: String(orderNum) } });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, pixModalOpen, slug, navigate]);

  const handleSubmitOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (cart.length === 0) return;

    if (formData.type === "delivery" && formData.zipCode.replace(/\D/g, "").length !== 8) {
      toast.error("CEP invalido. Por favor, digite os 8 numeros corretos.");
      return;
    }

    if (!isMesa && !isValidPhone(formData.customerPhone)) {
      toast.error("O numero de WhatsApp informado e invalido. Por favor, informe um DDD e numero validos.");
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setOrderLoading(true);
    try {
      const payload: PlaceOrderPayload = {
        ...formData,
        type: isMesa ? "mesa" : formData.type,
        tableNumber: isMesa ? mesaNumber : undefined,
        changeFor: formData.payment === "dinheiro" ? Number(formData.changeFor) : undefined,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          observation: item.observation || undefined,
        })),
        couponCode: appliedCoupon?.code,
        note: formData.note.trim() || undefined,
      };

      const res = await placeStoreOrder(slug, payload);

      setCart([]);
      setCheckoutOpen(false);

      // Dynamic PIX via Efí Bank
      if (formData.payment === "pix" && (res.pixQrCodeBase64 || res.pixCopyPaste)) {
        setPixData({ qrCodeBase64: res.pixQrCodeBase64, copyPaste: res.pixCopyPaste, orderNumber: res.orderNumber });
        setPixModalOpen(true);
        return;
      }

      // Static PIX key fallback
      if (formData.payment === "pix" && store.pixKey) {
        setPixData({ staticKey: store.pixKey, orderNumber: res.orderNumber });
        setPixModalOpen(true);
        return;
      }

      navigate({
        to: "/pedido/$slug/$orderNumber",
        params: { slug, orderNumber: String(res.orderNumber) }
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar pedido.");
    } finally {
      submittingRef.current = false;
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
              {store.isOpen === false ? (
                <Badge variant="destructive">FECHADO AGORA</Badge>
              ) : (
                <Badge variant="success">ABERTO AGORA</Badge>
              )}
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
              {store.deliveryRadius && (
                <div className="flex items-center gap-1.5">
                  <Navigation className="h-4 w-4" /> Raio: {store.deliveryRadius} km
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loyalty program banner */}
        {store.loyaltyProgram?.isActive && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 px-5 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">Programa de Fidelidade</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Ganhe <strong>{store.loyaltyProgram.pointsPerReal} ponto{store.loyaltyProgram.pointsPerReal !== 1 ? "s" : ""}</strong> por real gasto.
                Com <strong>{store.loyaltyProgram.minPointsToRedeem} pontos</strong> você ganha <strong>{fmt.format(store.loyaltyProgram.redeemValue)}</strong> de desconto!
              </p>
            </div>
          </div>
        )}

        {/* Loja fechada banner */}
        {store.isOpen === false && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-2xl">🔒</span>
            <div>
              <p className="font-bold text-destructive">Loja temporariamente fechada</p>
              <p className="text-sm text-muted-foreground">Este estabelecimento pausou os pedidos por um momento. Volte em breve!</p>
            </div>
          </div>
        )}

        {/* Categories Navigation + Search (Sticky) */}
        <div className="sticky top-0 z-40 -mx-4 bg-background/95 px-4 py-3 backdrop-blur-md border-b space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border bg-muted/50 pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {!search && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full px-5"
                onClick={() => { setActiveCategory("all"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                Tudo
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 rounded-full px-5 hover:bg-primary/10 hover:text-primary border-primary/20"
                  onClick={() => scrollToCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row pb-32">
          <div className="flex-1 space-y-10">
            {search.trim() && filteredProducts.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <p className="text-lg font-semibold">Nenhum produto encontrado</p>
                <p className="text-sm mt-1">Tente outra palavra-chave.</p>
              </div>
            )}
            {visibleCategories.map(cat => (
              <section key={cat} id={`cat-${cat}`} className="space-y-5 scroll-mt-32">
                <h2 className="text-xl font-black tracking-tight border-l-4 border-primary pl-4">{cat}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredProducts.filter(p => (p.category || "Geral") === cat).map(product => (
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

                      <Button
                        className="w-full mt-4"
                        size="lg"
                        disabled={store.isOpen === false}
                        onClick={() => setCheckoutOpen(true)}
                      >
                        {store.isOpen === false ? "Loja fechada no momento" : "Finalizar Pedido"}
                      </Button>
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
            disabled={store.isOpen === false}
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
            <DialogTitle>Finalizar Pedido{isMesa ? ` — Mesa ${mesaNumber}` : ""}</DialogTitle>
            <DialogDescription>
              {isMesa
                ? `Pedido da Mesa ${mesaNumber}. Confirme os itens e preencha seu nome.`
                : "Preencha os dados abaixo para enviar seu pedido para a loja."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOrder} className="space-y-6 py-4">
            {/* Mesa badge */}
            {isMesa && (
              <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg">
                  {mesaNumber}
                </div>
                <div>
                  <p className="font-bold">Mesa {mesaNumber}</p>
                  <p className="text-xs text-muted-foreground">Pedido será enviado direto para a cozinha.</p>
                </div>
              </div>
            )}

            {/* Itens do pedido com observação */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Itens do Pedido</Label>
              <div className="space-y-2 rounded-2xl border bg-muted/30 p-3">
                {cart.map(item => (
                  <div key={item.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.quantity}× {item.name}</span>
                      <span className="font-bold text-primary">{fmt.format(item.unitPrice * item.quantity)}</span>
                    </div>
                    <Input
                      placeholder="Observação (ex: sem tomate, sem cebola...)"
                      value={item.observation ?? ""}
                      onChange={e => updateItemObservation(item.productId, e.target.value)}
                      className="h-7 text-xs bg-background"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery/Pickup Toggle — oculto no modo mesa */}
            {!isMesa && (
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
            )}

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
                {store.deliveryRadius && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
                    <Navigation className="h-3.5 w-3.5 shrink-0" />
                    <span>Entregamos em até <strong>{store.deliveryRadius} km</strong> de distância da loja.</span>
                  </div>
                )}
              </div>
            )}

            {/* Pickup Info (if pickup) */}
            {formData.type === "pickup" && (store.street || store.city) && (
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <StoreIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Endereço para Retirada</p>
                    <p className="text-xs text-muted-foreground">Retire seu pedido diretamente na loja</p>
                  </div>
                </div>
                <div className="rounded-xl bg-background border p-3 space-y-1">
                  <p className="font-semibold text-sm">
                    {[store.street, store.number].filter(Boolean).join(", ")}
                  </p>
                  {store.neighborhood && (
                    <p className="text-sm text-muted-foreground">{store.neighborhood}</p>
                  )}
                  {store.city && (
                    <p className="text-sm text-muted-foreground">{store.city}{store.state ? ` - ${store.state}` : ""}</p>
                  )}
                </div>
                {store.averagePrepMinutes && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Tempo de preparo estimado: <strong>{store.averagePrepMinutes} minutos</strong></span>
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([store.street, store.number, store.neighborhood, store.city].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver no Google Maps
                </a>
              </div>
            )}

            {/* Personal Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu Nome</Label>
                <Input id="name" value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">WhatsApp {isMesa && <span className="text-xs text-muted-foreground font-normal">(opcional)</span>}</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.customerPhone}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(p => ({ ...p, customerPhone: val }));
                    const clean = val.replace(/\D/g, "");
                    if (clean.length >= 10 && store.loyaltyProgram?.isActive) {
                      getStoreLoyaltyBalance(slug, clean)
                        .then(setLoyaltyBalance)
                        .catch(() => setLoyaltyBalance(null));
                    } else {
                      setLoyaltyBalance(null);
                    }
                  }}
                  required={!isMesa}
                />
                {loyaltyBalance && store.loyaltyProgram?.isActive && (
                  <div className={cn(
                    "mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    loyaltyBalance.canRedeem
                      ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300"
                      : "border-border bg-muted/50 text-muted-foreground"
                  )}>
                    <Star className={cn("h-4 w-4 shrink-0", loyaltyBalance.canRedeem ? "text-yellow-500" : "text-muted-foreground")} />
                    <span>
                      <strong>{loyaltyBalance.points} pontos</strong>
                      {loyaltyBalance.canRedeem
                        ? ` — você pode resgatar ${fmt.format(loyaltyBalance.redeemDiscount)} de desconto neste pedido!`
                        : ` — faltam ${store.loyaltyProgram.minPointsToRedeem - loyaltyBalance.points} pontos para resgatar desconto.`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Forma de Pagamento</Label>
              <RadioGroup
                value={formData.payment}
                onValueChange={(v: any) => setFormData(p => ({ ...p, payment: v }))}
                className="grid grid-cols-3 gap-2"
              >
                <div className={store.efiActive ? "col-span-3" : ""}>
                  <RadioGroupItem value="pix" id="p-pix" className="peer sr-only" />
                  <Label
                    htmlFor="p-pix"
                    className={cn(
                      "flex cursor-pointer gap-2 rounded-xl border-2 p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all",
                      store.efiActive ? "flex-row items-center justify-center" : "flex-col items-center"
                    )}
                  >
                    <QrCode className="h-5 w-5 text-primary" />
                    <div className={store.efiActive ? "text-left" : "text-center"}>
                      <p className="text-sm font-bold">{store.efiActive ? "PIX — Pagamento Instantâneo" : "PIX"}</p>
                      {store.efiActive && <p className="text-[10px] text-muted-foreground">QR Code gerado automaticamente</p>}
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="cartao" id="p-card" className="peer sr-only" />
                  <Label htmlFor="p-card" className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-bold">Cartão</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dinheiro" id="p-cash" className="peer sr-only" />
                  <Label htmlFor="p-cash" className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
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

            {/* Observacao do pedido */}
            <div className="space-y-2">
              <Label htmlFor="note" className="flex items-center gap-1.5">
                Observacao <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <textarea
                id="note"
                rows={2}
                placeholder="Ex: sem cebola, ponto da carne bem passado..."
                value={formData.note ?? ""}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full rounded-xl border bg-muted/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 text-lg" disabled={orderLoading}>
                {orderLoading ? "Enviando Pedido..." : "Confirmar e Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Modal */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-sm py-8">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Pagamento via PIX</DialogTitle>
          </DialogHeader>

          {pixData?.qrCodeBase64 ? (
            /* Dynamic PIX via Efí Bank */
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-sm">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="h-44 w-44"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Aguardando pagamento...
                </div>
              </div>

              {pixData.copyPaste && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Ou use o PIX Copia e Cola</p>
                  <div className="flex items-center gap-2 rounded-xl border bg-muted p-3">
                    <code className="flex-1 overflow-hidden text-ellipsis text-xs font-mono">{pixData.copyPaste}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.copyPaste!);
                        toast.success("PIX Copia e Cola copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-green-500/10 p-3 text-center text-xs text-green-700 font-medium">
                Confirmacao automatica — seu pedido sera enviado para a cozinha assim que o pagamento for detectado.
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPixModalOpen(false);
                  navigate({ to: "/pedido/$slug/$orderNumber", params: { slug, orderNumber: String(pixData!.orderNumber) } });
                }}
              >
                Ir para Acompanhamento
              </Button>
            </div>
          ) : (
            /* Static PIX key fallback */
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData?.staticKey || "")}`}
                    alt="QR Code PIX"
                    className="h-44 w-44"
                  />
                </div>
                <p className="text-sm font-bold">Escaneie o QR Code</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">Ou copie a chave PIX</p>
                <div className="flex items-center gap-2 rounded-xl border bg-muted p-3">
                  <code className="flex-1 overflow-hidden text-ellipsis text-xs font-bold">{pixData?.staticKey || "Chave nao cadastrada"}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => {
                      if (!pixData?.staticKey) return;
                      navigator.clipboard.writeText(pixData.staticKey);
                      toast.success("Chave PIX copiada!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl bg-yellow-500/10 p-3 text-center text-xs text-yellow-600 font-medium">
                Seu pedido ja foi registrado. Realize o pagamento e acompanhe o status.
              </div>

              <Button
                className="w-full h-12"
                onClick={() => {
                  setPixModalOpen(false);
                  navigate({ to: "/pedido/$slug/$orderNumber", params: { slug, orderNumber: String(pixData!.orderNumber) } });
                }}
              >
                Acompanhar Pedido
              </Button>
            </div>
          )}
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
