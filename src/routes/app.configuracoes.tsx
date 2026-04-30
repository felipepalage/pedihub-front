import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const save = () => toast.success("Configurações salvas com sucesso!");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize sua operação no PEDIHUB.
        </p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          <Card title="Dados da empresa">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome">
                <Input defaultValue="Adega do Vinho Bom" />
              </Field>
              <Field label="CNPJ">
                <Input defaultValue="12.345.678/0001-90" />
              </Field>
              <Field label="Telefone">
                <Input defaultValue="(11) 98888-7777" />
              </Field>
              <Field label="Email">
                <Input type="email" defaultValue="contato@adegavinhobom.com" />
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="endereco" className="mt-6">
          <Card title="Endereço">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Field label="Rua">
                  <Input defaultValue="Rua das Flores" />
                </Field>
              </div>
              <Field label="Número">
                <Input defaultValue="123" />
              </Field>
              <Field label="Cidade">
                <Input defaultValue="São Paulo" />
              </Field>
              <Field label="Estado">
                <Input defaultValue="SP" />
              </Field>
              <Field label="CEP">
                <Input defaultValue="01234-000" />
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="operacao" className="mt-6">
          <Card title="Operação">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Horário de funcionamento">
                  <Input defaultValue="11:00 — 23:00" />
                </Field>
                <Field label="Tempo médio de preparo">
                  <Input defaultValue="35 min" />
                </Field>
                <Field label="Taxa de entrega base">
                  <Input defaultValue="R$ 8,00" />
                </Field>
                <Field label="Pedido mínimo">
                  <Input defaultValue="R$ 25,00" />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-medium">Aceitar pedidos automaticamente</p>
                  <p className="text-sm text-muted-foreground">
                    Pedidos novos passam direto para "Preparando"
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Card title="Identidade da marca">
            <div className="grid sm:grid-cols-2 gap-4">
              <UploadBox label="Logo" />
              <UploadBox label="Banner do cardápio" />
            </div>
            <Field label="Cor principal">
              <div className="flex gap-2">
                {["#E53935", "#1F1F1F", "#22C55E", "#F59E0B", "#3B82F6"].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-10 w-10 rounded-lg border-2 border-border hover:border-foreground transition-colors"
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ),
                )}
              </div>
            </Field>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={save}>Salvar alterações</Button>
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
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
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
      </button>
    </div>
  );
}
