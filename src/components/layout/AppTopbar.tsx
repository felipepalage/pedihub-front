import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { SidebarContent } from "./AppSidebar";
import { useAuth } from "@/lib/auth";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5172";

function getImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function AppTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const companyName = user?.merchantName ?? "PEDIHUB";
  const initials = companyName
    .split(" ")
    .map((chunk) => chunk[0])
    .slice(0, 2)
    .join("");
  const accountStatus =
    user?.status === "trial" ? "Conta teste" : user?.status === "ativo" ? "Conta ativa" : "Conta inativa";

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Notificacoes"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Nenhuma notificacao no momento.</p>
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
            <DropdownMenuItem asChild>
              <Link to="/app/configuracoes">Configuracoes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/login"
                onClick={() => logout()}
              >
                Sair
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
