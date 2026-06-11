import { Bell, Search, Menu, ShoppingBag, CircleCheck, PowerOff, Power } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { SidebarContent } from "./AppSidebar";
import { useAuth } from "@/lib/auth";
import { getImageUrl, getOrders, getSettings, setStoreOpen, type OrderListItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { statusLabels } from "@/lib/domain";
import { toast } from "sonner";

const STORAGE_KEY = "pedihub_seen_order_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function AppTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<OrderListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenRef = useRef<Set<string>>(getSeenIds());
  const [bellOpen, setBellOpen] = useState(false);

  // Store open/close state
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [togglingStore, setTogglingStore] = useState(false);

  const companyName = user?.merchantName ?? "PEDIHUB";
  const initials = companyName
    .split(" ")
    .map((chunk) => chunk[0])
    .slice(0, 2)
    .join("");
  const accountStatus =
    user?.status === "trial" ? "Conta teste" : user?.status === "ativo" ? "Conta ativa" : "Conta inativa";

  // Load initial store status
  useEffect(() => {
    if (user?.role === "SuperAdmin") return;
    getSettings()
      .then((s) => setIsOpen(s.isOpen !== false))
      .catch(() => {});
  }, [user?.role]);

  const toggleStore = async () => {
    if (isOpen === null || togglingStore) return;
    setTogglingStore(true);
    const next = !isOpen;
    try {
      await setStoreOpen(next);
      setIsOpen(next);
      toast.success(next ? "Loja aberta! Pedidos voltaram a ser aceitos." : "Loja pausada. Nenhum pedido sera aceito ate reabrir.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel alterar o status da loja.");
    } finally {
      setTogglingStore(false);
    }
  };

  const pollNotifications = useCallback(async () => {
    if (user?.role === "SuperAdmin") return;
    try {
      const raw = await getOrders({ filter: "pendentes" });
      const orders: OrderListItem[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.items) ? (raw as any).items : [];
      const actionable = orders.filter(
        (o) => o.status === "novo" || o.status === "pago" || o.status === "aguardando_pagamento"
      );

      const seen = seenRef.current;
      const newOnes = actionable.filter((o) => !seen.has(o.id));

      if (newOnes.length > 0) {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const merged = [...newOnes.filter((o) => !existingIds.has(o.id)), ...prev].slice(0, 30);
          return merged;
        });
        setUnreadCount((c) => c + newOnes.length);
      }
    } catch {}
  }, [user?.role]);

  useEffect(() => {
    pollNotifications();
    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  const handleBellOpen = (open: boolean) => {
    setBellOpen(open);
    if (open) {
      notifications.forEach((n) => seenRef.current.add(n.id));
      saveSeenIds(seenRef.current);
      setUnreadCount(0);
    }
  };

  const statusIcon = (status: OrderListItem["status"]) => {
    if (status === "pago") return <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "aguardando_pagamento") return <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse inline-block" />;
    return <ShoppingBag className="h-3.5 w-3.5 text-primary" />;
  };

  const isMerchant = user?.role !== "SuperAdmin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:gap-3 sm:px-4 md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 max-w-[85vw] border-r-0 p-0">
          <SheetTitle className="sr-only">Menu de navegacao</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden max-w-md flex-1 sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos, produtos, clientes..."
            className="border-transparent bg-muted/50 pl-9 focus-visible:bg-background"
          />
        </div>
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Store open/close toggle */}
        {isMerchant && isOpen !== null && (
          <button
            onClick={toggleStore}
            disabled={togglingStore}
            title={isOpen ? "Pausar loja" : "Reabrir loja"}
            className={cn(
              "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all lg:flex",
              isOpen
                ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
              togglingStore && "opacity-60 cursor-not-allowed"
            )}
          >
            {isOpen ? (
              <><Power className="h-3.5 w-3.5" /> Loja aberta</>
            ) : (
              <><PowerOff className="h-3.5 w-3.5 animate-pulse" /> Loja pausada</>
            )}
          </button>
        )}

        <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 lg:flex">
          <span className={`h-2 w-2 rounded-full ${user?.status === "inativo" ? "bg-muted-foreground" : "bg-success animate-pulse"}`} />
          <span className="text-xs font-medium text-muted-foreground">{accountStatus}</span>
        </div>

        <button
          aria-label="Buscar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted sm:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Notification Bell */}
        <DropdownMenu open={bellOpen} onOpenChange={handleBellOpen}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Notificacoes"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-bold">Notificacoes</span>
              {notifications.length > 0 && (
                <Link
                  to="/app/pedidos"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setBellOpen(false)}
                >
                  Ver todos pedidos →
                </Link>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sem notificacoes no momento.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to="/app/pedidos"
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {statusIcon(n.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {n.status === "pago" ? "PIX confirmado" : n.status === "aguardando_pagamento" ? "Aguardando PIX" : "Novo pedido"} #{n.number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{n.customerName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          n.status === "pago" ? "bg-emerald-100 text-emerald-700" :
                          n.status === "aguardando_pagamento" ? "bg-yellow-100 text-yellow-700" :
                          "bg-primary/10 text-primary"
                        )}>
                          {statusLabels[n.status] ?? n.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1 transition-colors hover:bg-muted sm:pr-2">
            <Avatar className="h-8 w-8">
              {user?.logoUrl ? <AvatarImage src={getImageUrl(user.logoUrl)} alt={companyName} /> : null}
              <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-tight">{companyName}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Mobile store toggle */}
            {isMerchant && isOpen !== null && (
              <>
                <DropdownMenuItem onClick={toggleStore} disabled={togglingStore} className={isOpen ? "text-destructive" : "text-success"}>
                  {isOpen ? <><PowerOff className="mr-2 h-4 w-4" /> Pausar loja</> : <><Power className="mr-2 h-4 w-4" /> Reabrir loja</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/app/configuracoes">Configuracoes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login" onClick={() => logout()}>
                Sair
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
