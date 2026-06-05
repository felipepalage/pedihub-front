import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  ShoppingBag,
  BarChart3,
  Plug,
  CheckCircle2,
  Zap,
  Globe,
  MessageCircle,
  Truck,
  QrCode,
  TrendingUp,
  Clock,
  Shield,
  ChefHat,
  Smartphone,
} from "lucide-react";
import heroImg from "@/assets/login-hero.jpg";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "PEDIHUB - Centralize todos os seus pedidos" },
      {
        name: "description",
        content:
          "Gerencie iFood, 99Food, WhatsApp, site proprio e balcao em um so painel. Aumente suas vendas com o PEDIHUB.",
      },
    ],
  }),
  component: LoginPage,
});

const features = [
  {
    icon: Globe,
    title: "Loja Online Propria",
    desc: "Crie seu cardápio digital em minutos e compartilhe o link com seus clientes.",
  },
  {
    icon: MessageCircle,
    title: "Pedidos via WhatsApp",
    desc: "Receba e gerencie pedidos do WhatsApp direto no painel, sem confusão.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    desc: "Acompanhe faturamento, produtos mais vendidos e horários de pico.",
  },
  {
    icon: QrCode,
    title: "Cardápio por QR Code",
    desc: "Gere QR codes para cada mesa e deixe seus clientes pedir sozinhos.",
  },
  {
    icon: Truck,
    title: "Controle de Entregas",
    desc: "Acompanhe o status de cada pedido do recebimento até a entrega.",
  },
  {
    icon: Shield,
    title: "Pagamento Seguro",
    desc: "Integração com Mercado Pago para cartão e PIX com aprovação automática.",
  },
];

// Testimonials removed - replace with real customer data from API when available
const testimonials: any[] = [];

function LoginPage() {
  const navigate = useNavigate();
  const { ready, isAuthenticated, setSessionFromAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "features">("login");
  const loginFormRef = useRef<HTMLDivElement>(null);

  const scrollToLogin = () => {
    loginFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("features")}>
              Ver funcionalidades
            </Button>
            <Button size="sm" onClick={scrollToLogin}>
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background px-4 py-20 text-center">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
            <Zap className="h-3.5 w-3.5" />
            Plataforma completa para delivery
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
            Todos seus pedidos
            <span className="text-primary"> em um so lugar</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            iFood, 99Food, WhatsApp, site proprio e balcao com gestao unificada. Aumente suas vendas e pare de perder pedidos.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-14 px-8 text-base font-bold" asChild>
              <Link to="/cadastro">
                Criar conta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" onClick={() => setActiveTab("login")}>
              Ja tenho conta
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sem cartão de crédito. Configuração em 5 minutos.</p>
        </div>
      </section>

      {/* Stats Bar - Removed mock data */}

      {/* Main Content - Side by side on desktop */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: Login Form */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24" ref={loginFormRef}>
              <div className="rounded-3xl border bg-card p-8 shadow-xl">
                <h2 className="text-2xl font-bold">Acessar painel</h2>
                <p className="mt-1 text-muted-foreground">Entre na sua conta para gerenciar seus pedidos.</p>

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
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="h-12 w-full text-base font-semibold">
                    <Link to="/cadastro">
                      Criar conta gratis
                      <Zap className="ml-2 h-4 w-4 text-primary" />
                    </Link>
                  </Button>
                </form>

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>Seus dados estão seguros. Usamos criptografia de ponta a ponta.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                Tudo que seu delivery precisa
              </h2>
              <p className="mt-3 text-muted-foreground">
                Uma plataforma completa para gerenciar seu negócio de delivery.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Testimonials - Removed mock data, will add real testimonials from API later */}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="border-t bg-primary px-4 py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl">
          <ChefHat className="mx-auto mb-4 h-12 w-12 opacity-80" />
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Centralize todos seus pedidos
          </h2>
          <p className="mt-4 text-lg opacity-80">
            Gerencie iFood, 99Food, WhatsApp, site próprio e balcão em um único painel. Aumente suas vendas.
          </p>
          <Button size="lg" variant="secondary" className="mt-8 h-14 px-10 text-base font-bold" asChild>
            <Link to="/cadastro">
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        © 2026 PEDIHUB · Todos os pedidos em um so lugar.
      </footer>
    </div>
  );
}
