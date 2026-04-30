import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ShoppingBag, BarChart3, Plug } from "lucide-react";
import heroImg from "@/assets/login-hero.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — PEDIHUB" },
      {
        name: "description",
        content:
          "Acesse o PEDIHUB e centralize todos seus pedidos em um só lugar.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: integrar com C# .NET API
    setTimeout(() => navigate({ to: "/app" }), 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-10 lg:px-16">
        <Logo />

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Centralize seus pedidos e venda mais.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  defaultValue="demo@pedihub.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/login"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="demo1234"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">
                    ou
                  </span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-11 text-base font-semibold"
              >
                <Link to="/cadastro">Teste grátis por 14 dias</Link>
              </Button>
            </form>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © 2026 PEDIHUB · Todos os pedidos em um só lugar.
        </p>
      </div>

      {/* Visual side */}
      <div className="hidden lg:flex relative bg-secondary text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-90">
          <img
            src={heroImg}
            alt="Ilustração delivery PEDIHUB"
            className="h-full w-full object-cover"
            width={1024}
            height={1280}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              Todos seus pedidos em{" "}
              <span className="text-primary">um só lugar.</span>
            </h2>
            <p className="text-white/70 text-lg">
              iFood, WhatsApp, site próprio e balcão — gestão unificada para
              bares, adegas, restaurantes e delivery.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: ShoppingBag, label: "Pedidos" },
                { icon: BarChart3, label: "Relatórios" },
                { icon: Plug, label: "Integrações" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3 text-center"
                >
                  <f.icon className="h-5 w-5 mx-auto text-primary mb-1.5" />
                  <p className="text-xs font-medium text-white/80">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
