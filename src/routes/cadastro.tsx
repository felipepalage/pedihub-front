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
import { Check, ShieldCheck, FileText, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isValidPhone, isValidCPF, isValidCNPJ } from "@/lib/validators";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta - PEDIHUB" },
      {
        name: "description",
        content: "Crie sua conta no PEDIHUB e centralize iFood, 99Food, WhatsApp e site proprio.",
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
    documentType: "cnpj" as "cpf" | "cnpj",
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

  const next = () => {
    setError("");
    if (step === 1) {
      if (!isValidPhone(form.phone)) {
        setError("O numero de telefone ou WhatsApp informado e invalido.");
        return;
      }
    }
    if (step === 2) {
      if (form.documentType === "cpf" && !isValidCPF(form.cnpj)) {
        setError("O CPF informado e invalido. Verifique os numeros.");
        return;
      }
      if (form.documentType === "cnpj" && !isValidCNPJ(form.cnpj)) {
        setError("O CNPJ informado e invalido. Verifique os numeros.");
        return;
      }
    }
    if (step === 3) {
      if (form.zipCode.replace(/\D/g, "").length !== 8) {
        setError("O CEP informado e invalido.");
        return;
      }
    }
    setStep((current) => Math.min(4, current + 1));
  };
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

  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setForm((current) => ({
          ...current,
          street: data.logradouro || current.street,
          neighborhood: data.bairro || current.neighborhood,
          city: data.localidade || current.city,
          state: data.uf || current.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
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
                  <Field label="Tipo de Documento">
                    <Select 
                      value={form.documentType} 
                      onValueChange={(v: "cpf" | "cnpj") => setField("documentType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={form.documentType === "cnpj" ? "CNPJ" : "CPF"}>
                    <Input 
                      value={form.cnpj} 
                      onChange={(e) => setField("cnpj", e.target.value)} 
                      placeholder={form.documentType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                      required 
                    />
                  </Field>
                </div>
                <Field label="Quantidade de unidades">
                  <Input
                    type="number"
                    min={1}
                    value={form.unitCount}
                    onChange={(e) => setField("unitCount", e.target.value)}
                    required
                  />
                </Field>
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
                  <Input 
                    value={form.zipCode} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setField("zipCode", val);
                      if (val.replace(/\D/g, "").length === 8) fetchAddress(val);
                    }} 
                  />
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
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">Quase pronto!</h2>
                <p className="text-sm text-muted-foreground mt-1">Para sua seguranca e a nossa, leia e aceite nosso contrato de prestacao de servicos.</p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-bold">CONTRATO DE LICENÇA - PEDIHUB</span>
                </div>
                <div className="h-40 overflow-y-auto rounded-lg bg-card p-4 text-[10px] leading-relaxed text-muted-foreground border">
                  <p className="font-bold text-foreground mb-2 underline uppercase">1. OBJETO E PERIODICIDADE</p>
                  O presente contrato concede ao LICENCIADO 7 (sete) dias corridos de acesso integral e gratuito a plataforma PEDIHUB a partir da data de criacao desta conta. Apos este periodo, a continuidade do servico estara condicionada a aquisicao de TOKENS DE ACESSO junto ao suporte oficial.
                  <p className="font-bold text-foreground my-2 underline uppercase">2. POLITICA DE REEMBOLSO (ANTI-PREJUIZO)</p>
                  Considerando a natureza digital do servico e a disponibilizacao imediata de recursos, o LICENCIADO declara estar ciente de que VALORES PAGOS POR TOKENS OU PLANOS NAO SERAO DEVOLVIDOS sob nenhuma hipotese, visto que o periodo de teste gratuito ja serve para validacao da ferramenta.
                  <p className="font-bold text-foreground my-2 underline uppercase">3. SUPORTE E MANUTENCAO</p>
                  O PEDIHUB garante a manutencao da estabilidade do sistema, reservando-se o direito de realizar atualizacoes para melhoria da experiencia do usuario.
                </div>
                
                <label className="flex cursor-pointer items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors">
                  <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(!!value)} className="mt-1" />
                  <span className="text-xs font-medium leading-tight">
                    Li e concordo com os termos do contrato acima, incluindo a politica de 7 dias gratis e nao-reembolso de tokens.
                  </span>
                </label>
              </div>
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
