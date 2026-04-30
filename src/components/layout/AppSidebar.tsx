import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Plug,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/app" | "/app/pedidos" | "/app/catalogo" | "/app/integracoes" | "/app/relatorios" | "/app/clientes" | "/app/configuracoes";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: number;
};

const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/pedidos", label: "Pedidos", icon: ShoppingBag, badge: 3 },
  { to: "/app/catalogo", label: "Catálogo", icon: Package },
  { to: "/app/integracoes", label: "Integrações", icon: Plug },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-elegant)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/login"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sair
        </Link>
        <p className="mt-3 px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
          Powered by PEDIHUB
        </p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-sidebar-border">
      <SidebarContent />
    </aside>
  );
}
