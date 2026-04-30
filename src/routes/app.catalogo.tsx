import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Copy, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { products, categories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/catalogo")({
  component: CatalogPage,
});

const fmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function CatalogPage() {
  const [cat, setCat] = useState<string>("Todas");
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      (cat === "Todas" || p.category === cat) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Catálogo
          </h1>
          <p className="text-muted-foreground">
            Gerencie produtos, preços e disponibilidade.
          </p>
        </div>
        <Button onClick={() => toast.success("Abrindo formulário...")}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {["Todas", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                cat === c
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-card border-border hover:bg-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <p className="text-lg font-semibold">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente outra categoria ou crie um novo produto.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-7xl">
                {p.image}
                {p.promo && (
                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                    PROMO
                  </span>
                )}
                {!p.available && (
                  <span className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Indisponível
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <h3 className="font-semibold mt-0.5 line-clamp-1">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary">
                    {fmt.format(p.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Estoque: {p.stock}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Switch defaultChecked={p.available} />
                    Disponível
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
