import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — PEDIHUB" },
      {
        name: "description",
        content:
          "Comece grátis no PEDIHUB. Centralize iFood, WhatsApp e mais em um só painel.",
      },
    ],
  }),
  component: SignupPage,
});

const steps = [
  { id: 1, label: "Conta" },
  { id: 2, label: "Estabelecimento" },
  { id: 3, label: "Endereço" },
  { id: 4, label: "Branding" },
];

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("Você precisa aceitar os termos.");
      return;
    }
    toast.success("Conta criada com sucesso! Bem-vindo ao PEDIHUB.");
    setTimeout(() => navigate({ to: "/app" }), 700);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <Logo />
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Já tem conta? Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Crie sua conta PEDIHUB
          </h1>
          <p className="mt-2 text-muted-foreground">
            Em poucos minutos seu estabelecimento estará no ar.
          </p>
        </div>

        {/* Stepper */}
        <ol className="flex items-center justify-between mb-10">
          {steps.map((s, i) => (
            <li key={s.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                    step > s.id
                      ? "bg-success border-success text-white"
                      : step === s.id
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-border text-muted-foreground",
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className="mt-2 text-xs font-medium hidden sm:block">
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step > s.id ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </li>
          ))}
        </ol>

        <form
          onSubmit={submit}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-[var(--shadow-card)]"
        >
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sua conta</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome do responsável">
                  <Input placeholder="Maria Silva" required />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <Input placeholder="(11) 99999-9999" required />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" placeholder="voce@empresa.com" required />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Senha">
                  <Input type="password" placeholder="••••••••" required />
                </Field>
                <Field label="Confirmar senha">
                  <Input type="password" placeholder="••••••••" required />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Seu estabelecimento</h2>
              <Field label="Nome do estabelecimento">
                <Input placeholder="Adega do Vinho Bom" required />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="CNPJ">
                  <Input placeholder="00.000.000/0000-00" required />
                </Field>
                <Field label="Quantidade de unidades">
                  <Input type="number" defaultValue={1} min={1} />
                </Field>
              </div>
              <Field label="Segmento">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adega">Adega</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="restaurante">Restaurante</SelectItem>
                    <SelectItem value="lanchonete">Lanchonete</SelectItem>
                    <SelectItem value="mercado">Mercado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Rua">
                    <Input placeholder="Rua das Flores" />
                  </Field>
                </div>
                <Field label="Número">
                  <Input placeholder="123" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Bairro">
                  <Input placeholder="Centro" />
                </Field>
                <Field label="CEP">
                  <Input placeholder="00000-000" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Cidade">
                  <Input placeholder="São Paulo" />
                </Field>
                <Field label="Estado">
                  <Input placeholder="SP" maxLength={2} />
                </Field>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sua marca</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <UploadBox label="Logo da empresa" />
                <UploadBox label="Foto de capa (opcional)" />
              </div>
              <label className="flex items-start gap-2 mt-6 cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(!!v)}
                />
                <span className="text-sm text-muted-foreground">
                  Aceito os{" "}
                  <a href="#" className="text-primary font-medium">
                    termos de uso
                  </a>{" "}
                  e a{" "}
                  <a href="#" className="text-primary font-medium">
                    política de privacidade
                  </a>
                  .
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={step === 1}
            >
              Voltar
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next}>
                Continuar
              </Button>
            ) : (
              <Button type="submit">Criar conta</Button>
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

function UploadBox({ label }: { label: string }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <button
        type="button"
        className="w-full aspect-[3/2] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <Upload className="h-6 w-6" />
        <span className="text-sm font-medium">Selecionar imagem</span>
        <span className="text-xs">PNG ou JPG até 2MB</span>
      </button>
    </div>
  );
}
