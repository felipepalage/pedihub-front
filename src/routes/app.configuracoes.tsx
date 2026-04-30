import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/api";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

type FormState = {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: string;
  averagePrepMinutes: string;
  deliveryFeeBase: string;
  minimumOrder: string;
  autoAcceptOrders: boolean;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
};

const initialForm: FormState = {
  companyName: "",
  cnpj: "",
  phone: "",
  email: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  openingHours: "",
  averagePrepMinutes: "35",
  deliveryFeeBase: "0",
  minimumOrder: "0",
  autoAcceptOrders: false,
  primaryColor: "#E53935",
  logoUrl: "",
  bannerUrl: "",
};

function SettingsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [savedSnapshot, setSavedSnapshot] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then((settings) => {
        const mapped: FormState = {
          companyName: settings.companyName,
          cnpj: settings.cnpj,
          phone: settings.phone,
          email: settings.email,
          street: settings.street,
          number: settings.number,
          neighborhood: settings.neighborhood,
          city: settings.city,
          state: settings.state,
          zipCode: settings.zipCode,
          openingHours: settings.openingHours,
          averagePrepMinutes: String(settings.averagePrepMinutes),
          deliveryFeeBase: String(settings.deliveryFeeBase),
          minimumOrder: String(settings.minimumOrder),
          autoAcceptOrders: settings.autoAcceptOrders,
          primaryColor: settings.primaryColor,
          logoUrl: settings.logoUrl,
          bannerUrl: settings.bannerUrl,
        };
        setForm(mapped);
        setSavedSnapshot(mapped);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar as configuracoes."))
      .finally(() => setLoading(false));
  }, []);

  const setField = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setError("");

    try {
      const saved = await updateSettings({
        companyName: form.companyName,
        cnpj: form.cnpj,
        phone: form.phone,
        email: form.email,
        street: form.street,
        number: form.number,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        openingHours: form.openingHours,
        averagePrepMinutes: Number(form.averagePrepMinutes || "0"),
        deliveryFeeBase: Number(form.deliveryFeeBase || "0"),
        minimumOrder: Number(form.minimumOrder || "0"),
        autoAcceptOrders: form.autoAcceptOrders,
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
      });

      const mapped: FormState = {
        companyName: saved.companyName,
        cnpj: saved.cnpj,
        phone: saved.phone,
        email: saved.email,
        street: saved.street,
        number: saved.number,
        neighborhood: saved.neighborhood,
        city: saved.city,
        state: saved.state,
        zipCode: saved.zipCode,
        openingHours: saved.openingHours,
        averagePrepMinutes: String(saved.averagePrepMinutes),
        deliveryFeeBase: String(saved.deliveryFeeBase),
        minimumOrder: String(saved.minimumOrder),
        autoAcceptOrders: saved.autoAcceptOrders,
        primaryColor: saved.primaryColor,
        logoUrl: saved.logoUrl,
        bannerUrl: saved.bannerUrl,
      };

      setForm(mapped);
      setSavedSnapshot(mapped);
      toast.success("Configuracoes salvas com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar as configuracoes.");
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar as configuracoes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <p className="text-muted-foreground">Carregando configuracoes...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configuracoes</h1>
        <p className="text-muted-foreground">Personalize sua operacao no PEDIHUB.</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="endereco">Endereco</TabsTrigger>
          <TabsTrigger value="operacao">Operacao</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          <Card title="Dados da empresa">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
              </Field>
              <Field label="CNPJ">
                <Input value={form.cnpj} onChange={(e) => setField("cnpj", e.target.value)} />
              </Field>
              <Field label="Telefone">
                <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="endereco" className="mt-6">
          <Card title="Endereco">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="Rua">
                  <Input value={form.street} onChange={(e) => setField("street", e.target.value)} />
                </Field>
              </div>
              <Field label="Numero">
                <Input value={form.number} onChange={(e) => setField("number", e.target.value)} />
              </Field>
              <Field label="Bairro">
                <Input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />
              </Field>
              <Field label="Cidade">
                <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
              </Field>
              <Field label="Estado">
                <Input value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} />
              </Field>
              <Field label="CEP">
                <Input value={form.zipCode} onChange={(e) => setField("zipCode", e.target.value)} />
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="operacao" className="mt-6">
          <Card title="Operacao">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Horario de funcionamento">
                  <Input value={form.openingHours} onChange={(e) => setField("openingHours", e.target.value)} />
                </Field>
                <Field label="Tempo medio de preparo (min)">
                  <Input
                    type="number"
                    value={form.averagePrepMinutes}
                    onChange={(e) => setField("averagePrepMinutes", e.target.value)}
                  />
                </Field>
                <Field label="Taxa de entrega base">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.deliveryFeeBase}
                    onChange={(e) => setField("deliveryFeeBase", e.target.value)}
                  />
                </Field>
                <Field label="Pedido minimo">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.minimumOrder}
                    onChange={(e) => setField("minimumOrder", e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-medium">Aceitar pedidos automaticamente</p>
                  <p className="text-sm text-muted-foreground">
                    Pedidos novos passam direto para "Preparando".
                  </p>
                </div>
                <Switch
                  checked={form.autoAcceptOrders}
                  onCheckedChange={(value) => setField("autoAcceptOrders", value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Card title="Identidade da marca">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL da logo">
                <Input value={form.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="URL do banner">
                <Input value={form.bannerUrl} onChange={(e) => setField("bannerUrl", e.target.value)} placeholder="https://..." />
              </Field>
            </div>
            <Field label="Cor principal">
              <div className="flex flex-wrap gap-2">
                {["#E53935", "#1F1F1F", "#22C55E", "#F59E0B", "#3B82F6"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setField("primaryColor", color)}
                    className={`h-10 w-10 rounded-lg border-2 transition-colors ${form.primaryColor === color ? "border-foreground" : "border-border"}`}
                    style={{ background: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </Field>
          </Card>
        </TabsContent>
      </Tabs>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setForm(savedSnapshot)} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
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
