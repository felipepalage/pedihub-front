import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta - PEDIHUB" },
      {
        name: "description",
        content: "Crie sua conta no PEDIHUB e centralize iFood, WhatsApp e site proprio.",
      },
    ],
  }),
  component: SignupPage,
});

const steps = [
  { id: 1, label: "Conta" },
  { id: 2, label: "Estabelecimento" },
  { id: 3, label: "Endereco" },
  { id: 4, label: "Finalizar" },
];

const segments = [
  { value: "adega", label: "Adega" },
  { value: "bar", label: "Bar" },
  { value: "restaurante", label: "Restaurante" },
  { value: "lanchonete", label: "Lanchonete" },
  { value: "mercado", label: "Mercado" },
];

function SignupPage() {
  const navigate = useNavigate();
  const { ready, isAuthenticated, setSessionFromAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    cnpj: "",
    unitCount: "1",
    segment: "",
    street: "",
    number: "",
    neighborhood: "",
    zipCode: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (ready && isAuthenticated) {
      navigate({ to: "/app" });
    }
  }, [isAuthenticated, navigate, ready]);

  const next = () => setStep((current) => Math.min(4, current + 1));
  const prev = () => setStep((current) => Math.max(1, current - 1));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    if (!accepted) {
      setError("Voce precisa aceitar os termos para criar a conta.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const auth = await register({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        cnpj: form.cnpj,
        unitCount: Number(form.unitCount || "1"),
        segment: form.segment,
        street: form.street,
        number: form.number,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
      });

      setSessionFromAuth(auth);
      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Logo />
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Ja tem conta? Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Crie sua conta PEDIHUB</h1>
          <p className="mt-2 text-muted-foreground">Em poucos minutos seu estabelecimento estara no ar.</p>
        </div>

        <ol className="mb-10 flex items-center justify-between">
          {steps.map((item, index) => (
            <li key={item.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    step > item.id
                      ? "border-success bg-success text-white"
                      : step === item.id
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {step > item.id ? <Check className="h-4 w-4" /> : item.id}
                </div>
                <span className="mt-2 hidden text-xs font-medium sm:block">{item.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 transition-colors", step > item.id ? "bg-success" : "bg-border")} />
              )}
            </li>
          ))}
        </ol>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sua conta</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do responsavel">
                  <Input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} required />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} required />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Senha">
                  <Input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required />
                </Field>
                <Field label="Confirmar senha">
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Seu estabelecimento</h2>
              <Field label="Nome do estabelecimento">
                <Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CNPJ">
                  <Input value={form.cnpj} onChange={(e) => setField("cnpj", e.target.value)} required />
                </Field>
                <Field label="Quantidade de unidades">
                  <Input
                    type="number"
                    min={1}
                    value={form.unitCount}
                    onChange={(e) => setField("unitCount", e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Field label="Segmento">
                <Select value={form.segment} onValueChange={(value) => setField("segment", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((segment) => (
                      <SelectItem key={segment.value} value={segment.value}>
                        {segment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Endereco</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Rua">
                    <Input value={form.street} onChange={(e) => setField("street", e.target.value)} />
                  </Field>
                </div>
                <Field label="Numero">
                  <Input value={form.number} onChange={(e) => setField("number", e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bairro">
                  <Input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />
                </Field>
                <Field label="CEP">
                  <Input value={form.zipCode} onChange={(e) => setField("zipCode", e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cidade">
                  <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
                </Field>
                <Field label="Estado">
                  <Input value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} maxLength={2} />
                </Field>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Finalizar cadastro</h2>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Logo, banner e personalizacao visual podem ser definidos depois em <strong>Configuracoes</strong>.
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-2">
                <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(!!value)} />
                <span className="text-sm text-muted-foreground">
                  Aceito os termos de uso e a politica de privacidade.
                </span>
              </label>
            </div>
          )}

          {error ? (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button type="button" variant="ghost" onClick={prev} disabled={step === 1 || loading}>
              Voltar
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next}>
                Continuar
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
