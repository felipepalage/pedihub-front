import { Bell, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 md:px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos, produtos, clientes..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            Loja aberta
          </span>
        </div>

        <button
          aria-label="Notificações"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-muted transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                AV
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-tight">
                Adega do Vinho
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Plano Pro
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/configuracoes">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login">Sair</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
