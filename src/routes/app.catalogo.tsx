import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Copy, Trash2, Search, PlusCircle, Trash, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getProducts,
  toggleProductAvailability,
  updateProduct,
  uploadMedia,
  type Product,
  type ProductPayload,
} from "@/lib/api";

export const Route = createFileRoute("/app/catalogo")({
  component: CatalogPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProductFormState = {
  image: string;
  name: string;
  description: string;
  category: string;
  price: string;
  available: boolean;
  stock: string;
  promo: boolean;
  modifierGroups: {
    id?: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    options: {
      id?: string;
      name: string;
      price: number;
    }[];
  }[];
};

const emptyForm: ProductFormState = {
  image: "🍽️",
  name: "",
  description: "",
  category: "",
  price: "0",
  available: true,
  stock: "0",
  promo: false,
  modifierGroups: [],
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5172";

function getImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function CatalogPage() {
  const [cat, setCat] = useState<string>("Todas");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const loadProducts = () => {
    setLoading(true);
    getProducts()
      .then((items) => {
        setProducts(items);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o catalogo."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (cat === "Todas" || product.category === cat) &&
          (!search || product.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [cat, products, search],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      image: product.image,
      name: product.name,
      description: product.description || "",
      category: product.category,
      price: String(product.price),
      available: product.available,
      stock: String(product.stock),
      promo: product.promo,
      modifierGroups: product.modifierGroups || [],
    });
    setDialogOpen(true);
  };

  const addModifierGroup = () => {
    setForm(prev => ({
      ...prev,
      modifierGroups: [
        ...prev.modifierGroups,
        { name: "", minQuantity: 0, maxQuantity: 1, options: [] }
      ]
    }));
  };

  const addOption = (groupIndex: number) => {
    setForm(prev => {
      const groups = [...prev.modifierGroups];
      groups[groupIndex].options.push({ name: "", price: 0 });
      return { ...prev, modifierGroups: groups };
    });
  };

  const removeGroup = (index: number) => {
    setForm(prev => ({
      ...prev,
      modifierGroups: prev.modifierGroups.filter((_, i) => i !== index)
    }));
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    setForm(prev => {
      const groups = [...prev.modifierGroups];
      groups[groupIndex].options = groups[groupIndex].options.filter((_, i) => i !== optionIndex);
      return { ...prev, modifierGroups: groups };
    });
  };

  const updateGroup = (index: number, field: string, value: any) => {
    setForm(prev => {
      const groups = [...prev.modifierGroups];
      groups[index] = { ...groups[index], [field]: value };
      return { ...prev, modifierGroups: groups };
    });
  };

  const updateOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    setForm(prev => {
      const groups = [...prev.modifierGroups];
      groups[groupIndex].options[optionIndex] = { ...groups[groupIndex].options[optionIndex], [field]: value };
      return { ...prev, modifierGroups: groups };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ProductPayload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
      };
      
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await createProduct(payload);
        toast.success("Produto criado com sucesso!");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    const loadingToast = toast.loading("Enviando imagem...");
    try {
      const { url } = await uploadMedia(file);
      setForm(prev => ({ ...prev, image: url }));
      toast.success("Imagem enviada!", { id: loadingToast });
    } catch (err) {
      toast.error("Erro ao enviar imagem.", { id: loadingToast });
    }
  };

  const onToggleAvailability = async (id: string) => {
    try {
      const updated = await toggleProductAvailability(id);
      setProducts((current) => current.map((product) => (product.id === id ? updated : product)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar a disponibilidade.");
    }
  };

  const onDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateProduct(id);
      setProducts((current) => [...current, duplicated].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Produto duplicado com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel duplicar o produto.");
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      toast.success("Produto excluido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel excluir o produto.");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Catalogo</h1>
          <p className="text-muted-foreground">Gerencie produtos, precos e disponibilidade.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 flex-wrap gap-2">
          {["Todas", ...categories].map((category) => (
            <button
              key={category}
              onClick={() => setCat(category)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                cat === category
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <EmptyState message="Carregando catalogo..." />
      ) : error ? (
        <EmptyState message={error} destructive />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nenhum produto encontrado para os filtros atuais." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-7xl overflow-hidden">
                {product.image && product.image.length > 5 ? (
                  <img src={getImageUrl(product.image)} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <Utensils className="h-16 w-16 opacity-10" />
                )}
                {product.promo ? (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                    PROMO
                  </span>
                ) : null}
                {!product.available ? (
                  <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
                    Indisponivel
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <h3 className="mt-0.5 line-clamp-1 font-semibold">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-tight min-h-[2rem]">
                  {product.description || "Sem descrição"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{fmt.format(product.price)}</span>
                  <span className="text-xs text-muted-foreground">Estoque: {product.stock}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Switch checked={product.available} onCheckedChange={() => onToggleAvailability(product.id)} />
                    Disponivel
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(product)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(product.id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Cadastre as informacoes do item e seus opcionais/adicionais.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={submit}>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-6 bg-muted/30">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-background bg-card shadow-sm">
                {form.image && form.image.length > 5 ? (
                  <img src={getImageUrl(form.image)} className="h-full w-full object-cover" />
                ) : (
                  <Utensils className="h-12 w-12 opacity-10" />
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="product-image" className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Selecionar Foto
                </Label>
                <input 
                  id="product-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">PNG, JPG ou GIF (Max 2MB)</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                  list="product-categories"
                  placeholder="Ex: Bebidas"
                />
                <datalist id="product-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>
              <Field label="Nome do produto">
                <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required placeholder="Ex: X-Salada Especial" />
              </Field>
            </div>

            <Field label="Descricao">
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Detalhes do produto..."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preco Base">
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Estoque">
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((current) => ({ ...current, stock: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-t pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Opcionais / Modificadores</h3>
                <Button type="button" variant="outline" size="sm" onClick={addModifierGroup}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Grupo
                </Button>
              </div>

              {form.modifierGroups.map((group, gIdx) => (
                <div key={gIdx} className="rounded-2xl border bg-muted/20 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid flex-1 gap-2 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                         <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Grupo</Label>
                         <Input 
                           value={group.name} 
                           onChange={(e) => updateGroup(gIdx, "name", e.target.value)}
                           placeholder="Ex: Escolha o ponto"
                         />
                      </div>
                      <div>
                         <Label className="text-[10px] uppercase font-bold text-muted-foreground">Min</Label>
                         <Input 
                           type="number" 
                           value={group.minQuantity} 
                           onChange={(e) => updateGroup(gIdx, "minQuantity", parseInt(e.target.value))}
                         />
                      </div>
                      <div>
                         <Label className="text-[10px] uppercase font-bold text-muted-foreground">Max</Label>
                         <Input 
                           type="number" 
                           value={group.maxQuantity} 
                           onChange={(e) => updateGroup(gIdx, "maxQuantity", parseInt(e.target.value))}
                         />
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive mt-6" onClick={() => removeGroup(gIdx)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="pl-4 border-l-2 space-y-2">
                    {group.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <Input 
                          placeholder="Nome da opção" 
                          className="flex-1 h-8 text-xs"
                          value={opt.name}
                          onChange={(e) => updateOption(gIdx, oIdx, "name", e.target.value)}
                        />
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Preço" 
                          className="w-24 h-8 text-xs"
                          value={opt.price}
                          onChange={(e) => updateOption(gIdx, oIdx, "price", parseFloat(e.target.value))}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeOption(gIdx, oIdx)}>
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => addOption(gIdx)}>
                      + Adicionar Opção
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Disponivel</span>
                <Switch
                  checked={form.available}
                  onCheckedChange={(value) => setForm((current) => ({ ...current, available: value }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>Em promocao</span>
                <Switch
                  checked={form.promo}
                  onCheckedChange={(value) => setForm((current) => ({ ...current, promo: value }))}
                />
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Criar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

function EmptyState({ message, destructive = false }: { message: string; destructive?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
      <p className={`text-lg font-semibold ${destructive ? "text-destructive" : ""}`}>{message}</p>
    </div>
  );
}
