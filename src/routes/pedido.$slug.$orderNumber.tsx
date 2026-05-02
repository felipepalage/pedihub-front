import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  getStoreOrder, 
  getStoreInfo,
  type OrderDetail, 
  type StorePublic 
} from "@/lib/api";
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Store as StoreIcon, 
  ChefHat, 
  PackageCheck,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusLabels, paymentLabels } from "@/lib/domain";

export const Route = createFileRoute("/pedido/$slug/$orderNumber")({
  component: OrderTrackingPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function OrderTrackingPage() {
  const { slug, orderNumber } = Route.useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [store, setStore] = useState<StorePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, s] = await Promise.all([
          getStoreOrder(slug, Number(orderNumber)),
          getStoreInfo(slug)
        ]);
        setOrder(o);
        setStore(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Auto refresh every 20 seconds to catch status changes
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [slug, orderNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-lg font-medium text-muted-foreground">Localizando seu pedido...</div>
      </div>
    );
  }

  if (!order || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Pedido nao encontrado</h1>
        <p className="mt-2 text-muted-foreground">Nao conseguimos localizar o pedido #{orderNumber}.</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to={`/${slug}`}>Voltar para a loja</Link>
        </Button>
      </div>
    );
  }

  const steps = [
    { id: "novo", label: "Recebido", icon: Clock },
    { id: "aceito", label: "Aceito", icon: PackageCheck },
    { id: "preparando", label: "Na Cozinha", icon: ChefHat },
    { id: "saiu_entrega", label: order.type === "delivery" ? "Em Entrega" : "Pronto para Retirada", icon: order.type === "delivery" ? Truck : StoreIcon },
    { id: "finalizados", label: "Entregue", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  // Special case for "finalizado" mapping
  const activeIndex = order.status === "finalizado" ? 4 : currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Top Header */}
      <div className="bg-card border-b px-4 py-4 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Link to={`/${slug}`} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {store.companyName}
          </Link>
          <span className="text-sm font-bold bg-muted px-3 py-1 rounded-full">Pedido #{order.number}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Status Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            {order.status === "novo" ? "Pedido Recebido! 🍟" :
             order.status === "aceito" ? "Tudo certo! ✅" :
             order.status === "preparando" ? "Saindo do forno! 👨‍🍳" :
             order.status === "saiu_entrega" ? (order.type === "delivery" ? "Esta a caminho! 🚀" : "Pode vir buscar! 🏠") :
             order.status === "finalizado" ? "Entregue! ✨" : "Aguardando..."}
          </h1>
          <p className="text-muted-foreground">
            {order.status === "novo" ? "Estamos aguardando a loja confirmar seu pedido." :
             order.status === "aceito" ? "A loja confirmou seu pedido e ja vai iniciar." :
             order.status === "preparando" ? "Seu pedido ja esta sendo preparado com carinho." :
             order.status === "saiu_entrega" ? (order.type === "delivery" ? "O motoboy ja saiu com seu pedido." : "Seu pedido ja esta pronto para ser retirado.") :
             order.status === "finalizado" ? "Esperamos que tenha tido uma otima experiencia!" : "..."}
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="relative pt-12 pb-8">
          <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted rounded-full" />
          <div 
            className="absolute left-0 top-1/2 h-1 bg-primary rounded-full transition-all duration-1000" 
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-card transition-all duration-500",
                    isPast ? "bg-primary text-primary-foreground" : 
                    isCurrent ? "bg-primary text-primary-foreground scale-125 shadow-lg shadow-primary/20" : 
                    "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-center max-w-[60px]",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Info Card */}
        <div className="rounded-3xl border bg-card p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-bold text-lg">Detalhes do Pedido</h2>
            <span className="text-xs text-muted-foreground">{new Date(order.orderedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Entrega para</span>
              <span className="font-semibold">{order.customerName}</span>
              <span className="text-sm text-muted-foreground">
                {order.type === "delivery" ? `${order.street}, ${order.addressNumber}` : "Retirada no Local"}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Itens</span>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.qty}x {item.name}</span>
                  <span className="font-medium">{fmt.format(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt.format(order.total - order.deliveryFee + (order.couponDiscount || 0))}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>{fmt.format(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 font-bold text-xl">
                <span>Total</span>
                <span className="text-primary">{fmt.format(order.total)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase text-right">
                Pagamento em {paymentLabels[order.payment as any] || order.payment}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full h-12 rounded-2xl" asChild>
            <a href={`https://wa.me/55${store.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5 text-green-500" />
              Falar com a loja no WhatsApp
            </a>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to={`/${slug}`}>Pedir algo mais</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
