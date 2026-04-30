import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Copy, Trash2, Search } from "lucide-react";
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
  category: string;
  price: string;
  available: boolean;
  stock: string;
  promo: boolean;
};

const emptyForm: ProductFormState = {
  image: "🍽️",
  name: "",
  category: "",
  price: "0",
  available: true,
  stock: "0",
  promo: false,
};

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
      category: product.category,
      price: String(product.price),
      available: product.available,
      stock: String(product.stock),
      promo: product.promo,
    });
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: ProductPayload = {
      image: form.image || "🍽️",
      name: form.name,
      category: form.category,
      price: Number(form.price || "0"),
      available: form.available,
      stock: Number(form.stock || "0"),
      promo: form.promo,
    };

    try {
      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts((current) => current.map((product) => (product.id === editingId ? updated : product)));
        toast.success("Produto atualizado com sucesso.");
      } else {
        const created = await createProduct(payload);
        setProducts((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Produto criado com sucesso.");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar o produto.");
    } finally {
      setSaving(false);
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
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-7xl">
                {product.image}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Cadastre as informacoes do item para sincronizar o catalogo do PEDIHUB.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Imagem / emoji">
                <Input value={form.image} onChange={(e) => setForm((current) => ({ ...current, image: e.target.value }))} />
              </Field>
              <Field label="Categoria">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                  list="product-categories"
                />
                <datalist id="product-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Nome do produto">
              <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preco">
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
