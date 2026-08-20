import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { useMarketStore, type MarketProduct } from "@/hooks/use-market-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mercado")({
  component: AdminMercadoPage,
});

export function AdminMercadoPage() {
  const { products, categories, minOrder, saveProducts, saveMinOrder } = useMarketStore();
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMinOrder, setNewMinOrder] = useState(minOrder);

  // 1. Atualizar Preço e Estoque
  const handleUpdateItem = (id: string, newPrice: number, newStock: number) => {
    if (isNaN(newPrice) || newPrice <= 0 || isNaN(newStock) || newStock < 0) {
      toast.error("Informe valores válidos para preço e estoque.");
      return;
    }
    const updated = products.map((p) => 
      p.id === id ? { ...p, price: newPrice, stock: newStock } : p
    );
    saveProducts(updated);
    setEditingId(null);
    toast.success("Preço e estoque atualizados com sucesso!");
  };

  // 2. Excluir Produto
  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
    toast.success("Produto removido do catálogo!");
  };

  // 3. Adicionar Novo Produto
  const handleAddProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? categories[0]);
    const price = Number(form.get("price") ?? 0);
    const stock = Number(form.get("stock") ?? 0);

    if (!name || price <= 0) {
      toast.error("Preencha o nome e um preço válido.");
      return;
    }

    const newProd: MarketProduct = {
      id: "prod-" + Date.now(),
      name,
      category,
      price,
      stock: Math.max(0, stock),
    };

    saveProducts([newProd, ...products]);
    setIsCreating(false);
    toast.success("Novo produto adicionado ao catálogo!");
  };

  // 4. Salvar Novo Pedido Mínimo
  const handleSaveMinOrder = () => {
    saveMinOrder(newMinOrder);
    toast.success(`Pedido mínimo atualizado para R$ ${newMinOrder.toFixed(2)}!`);
  };

  const produtosFiltrados = products.filter((p) => {
    const matchCat = categoriaFiltro === "Todas" || p.category === categoriaFiltro;
    const matchBusca = p.name.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Gestão do Minimercado & Estoque"
      subtitle="Defina o estoque real de cada item, gerencie preços e o pedido mínimo da Zelo."
    >
      <div className="space-y-6">
        
        {/* Painel Superior: Pedido Mínimo e Novo Produto */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/80 bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Regra de Pedido Mínimo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Valor mínimo exigido no carrinho de Hóspedes.
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.50"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value))}
                  className="pl-8 h-9 text-sm font-bold"
                />
              </div>
              <Button onClick={handleSaveMinOrder} size="sm" className="h-9 cursor-pointer">
                Salvar
              </Button>
            </div>
          </Card>

          <Button
            onClick={() => setIsCreating(true)}
            className="h-full min-h-[56px] rounded-xl flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Adicionar Produto
          </Button>
        </div>

        {/* Modal / Card para Adicionar Produto */}
        {isCreating && (
          <Card className="border-primary/40 bg-card p-5 shadow-lg animate-in fade-in-50">
            <form onSubmit={handleAddProduct} className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-semibold text-sm">Novo Item de Mercado</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">Nome e Gramatura/Volume</label>
                  <Input
                    name="name"
                    required
                    placeholder="Ex: Coca-Cola 2L"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                  <select
                    name="category"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Preço (R$)</label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="h-9 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Estoque Inicial (un)</label>
                  <Input
                    name="stock"
                    type="number"
                    defaultValue={0}
                    required
                    className="h-9 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Salvar Item
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filtrar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
            {["Todas", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoriaFiltro(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                  categoriaFiltro === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Produtos para Abastecer */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {produtosFiltrados.map((p) => (
            <Card
              key={p.id}
              className="p-3.5 border-border/70 hover:border-primary/40 transition-all flex items-center justify-between gap-3 text-left shadow-sm"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-primary tracking-wider block">
                  {p.category}
                </span>
                <h4 className="font-medium text-xs text-foreground truncate">{p.name}</h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingId === p.id ? (
                  <div className="flex items-center gap-1">
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={p.price}
                        id={`price-admin-${p.id}`}
                        title="Preço (R$)"
                        placeholder="Preço"
                        className="w-16 h-7 text-[11px] font-bold px-1"
                      />
                      <Input
                        type="number"
                        defaultValue={p.stock}
                        id={`stock-admin-${p.id}`}
                        title="Estoque (un)"
                        placeholder="Estoque"
                        className="w-16 h-7 text-[11px] font-bold px-1"
                      />
                    </div>
                    <Button
                      size="icon"
                      className="h-14 w-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        const priceEl = document.getElementById(
                          `price-admin-${p.id}`
                        ) as HTMLInputElement;
                        const stockEl = document.getElementById(
                          `stock-admin-${p.id}`
                        ) as HTMLInputElement;
                        handleUpdateItem(
                          p.id, 
                          Number(priceEl?.value || p.price),
                          Number(stockEl?.value || p.stock)
                        );
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="font-serif text-sm font-bold text-foreground block">
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className={`text-[10px] font-medium ${p.stock === 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                      Estoque: <strong className="text-foreground">{p.stock} un</strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center border-l pl-2 gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                    title="Editar Preço e Estoque"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteProduct(p.id)}
                    title="Excluir Produto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </DashboardShell>
  );
}