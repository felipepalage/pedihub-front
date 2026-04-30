import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ShoppingBag, BarChart3, Plug } from "lucide-react";
import heroImg from "@/assets/login-hero.jpg";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar - PEDIHUB" },
      {
        name: "description",
        content: "Acesse o PEDIHUB e centralize todos os seus pedidos em um so lugar.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { ready, isAuthenticated, setSessionFromAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (ready && isAuthenticated) {
      navigate({ to: "/app" });
    }
  }, [isAuthenticated, navigate, ready]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login({ email, password });
      setSessionFromAuth(auth);
      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-6 sm:py-10 lg:px-16">
        <Logo />

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bem-vindo de volta</h1>
            <p className="mt-2 text-muted-foreground">Centralize seus pedidos e venda mais.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <span className="text-xs font-medium text-muted-foreground">JWT + SQL Server</span>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button asChild variant="outline" className="h-11 w-full text-base font-semibold">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </form>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 PEDIHUB · Todos os pedidos em um so lugar.</p>
      </div>

      <div className="relative hidden overflow-hidden bg-secondary text-secondary-foreground lg:flex">
        <div className="absolute inset-0 opacity-90">
          <img
            src={heroImg}
            alt="Painel de pedidos do PEDIHUB"
            className="h-full w-full object-cover"
            width={1024}
            height={1280}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent" />

        <div className="relative z-10 flex w-full flex-col justify-end p-12">
          <div className="max-w-md space-y-6">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Todos seus pedidos em <span className="text-primary">um so lugar.</span>
            </h2>
            <p className="text-lg text-white/70">
              iFood, WhatsApp, site proprio e balcao com gestao unificada para delivery.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: ShoppingBag, label: "Pedidos" },
                { icon: BarChart3, label: "Relatorios" },
                { icon: Plug, label: "Integracoes" },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur"
                >
                  <feature.icon className="mx-auto mb-1.5 h-5 w-5 text-primary" />
                  <p className="text-xs font-medium text-white/80">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
