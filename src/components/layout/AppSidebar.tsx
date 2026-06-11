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
  ChefHat,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";
import { ShieldAlert } from "lucide-react";

type NavItem = {
  to:
    | "/app"
    | "/app/pedidos"
    | "/app/kds"
    | "/app/catalogo"
    | "/app/integracoes"
    | "/app/relatorios"
    | "/app/clientes"
    | "/app/configuracoes";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  onlyMerchant?: boolean;
  onlySuperAdmin?: boolean;
};

const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/app/kds", label: "Cozinha (KDS)", icon: ChefHat, onlyMerchant: true },
  { to: "/app/catalogo", label: "Catalogo", icon: Package },
  { to: "/app/integracoes", label: "Integracoes", icon: Plug },
  { to: "/app/relatorios", label: "Relatorios", icon: BarChart3 },
  { to: "/app/clientes", label: "Clientes", icon: Users, onlySuperAdmin: true },
  { to: "/app/configuracoes", label: "Configuracoes", icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        {user?.logoUrl ? (
          <img src={getImageUrl(user.logoUrl)} alt={user.merchantName} className="h-8 max-w-[160px] object-contain" />
        ) : (
          <Logo variant="light" />
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {user?.role === "SuperAdmin" && (
          <Link
            to="/app/admin"
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
              pathname.startsWith("/app/admin") && "bg-purple-600 text-white hover:bg-purple-700 hover:text-white shadow-sm"
            )}
          >
            <ShieldAlert className="h-[18px] w-[18px]" />
            Administrador
          </Link>
        )}

        {navItems
          .filter(item => {
            if (item.onlySuperAdmin) return user?.role === "SuperAdmin";
            if (item.onlyMerchant) return user?.role !== "SuperAdmin";
            return true;
          })
          .map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-elegant)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/login"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border md:flex">
      <SidebarContent />
    </aside>
  );
}
