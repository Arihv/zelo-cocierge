import { createFileRoute } from "@tanstack/react-router";
import { Minus, PackageCheck, Plus, Search, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { type MarketProduct, useMarketStore } from "@/hooks/use-market-store";
import { useSiteSettings } from "@/lib/api";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/mercado")({ component: HospedeMercadoPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HospedeMercadoPage() {
  const { products, categories, loading } = useMarketStore();
  const { data: siteSettings } = useSiteSettings();
  const minOrder = siteSettings?.minimumOrderAmount ?? 0;
  const { items, addItem, setQuantity, itemCount, total } = useGuestCart();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const marketItems = items.filter((item) => item.productId);
  const filteredProducts = useMemo(
    () => products.filter((product) =>
      (selectedCategory === "Todas" || product.category === selectedCategory)
      && product.name.toLowerCase().includes(search.toLowerCase())),
    [products, search, selectedCategory],
  );
  const availableProducts = products.filter((product) => product.stock > 0).length;
  const quantityFor = (productId: string) => marketItems.find((item) => item.productId === productId)?.quantity || 0;
  const addProduct = (product: MarketProduct) => {
    const quantity = quantityFor(product.id);
    if (quantity >= product.stock) {
      toast.error(`Estoque máximo atingido para ${product.name}.`);
      return;
    }
    addItem({ id: `product:${product.id}`, name: product.name, category: "mercado", unitPrice: product.price, productId: product.id });
  };

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/hospede/login"
      title="Minimercado de conveniência"
      subtitle={`Itens entregues no imóvel vinculado à sua reserva. Pedido mínimo do mercado: ${brl(minOrder)}.`}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Itens disponíveis</p><p className="mt-1 font-serif text-2xl font-bold text-primary">{availableProducts}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Itens no carrinho</p><p className="mt-1 font-serif text-2xl font-bold">{itemCount}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pedido mínimo</p><p className="mt-1 font-serif text-2xl font-bold">{brl(minOrder)}</p></CardContent></Card>
          </div>

          <Card className="border-border/80 shadow-sm"><CardContent className="space-y-4 p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar item no mercado" /></div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1">{["Todas", ...categories].map((category) => <Button key={category} size="sm" className="shrink-0" variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)}>{category}</Button>)}</div>
          </CardContent></Card>

          {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Atualizando catálogo…</p> : null}
          {!loading && filteredProducts.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum item encontrado neste filtro.</CardContent></Card> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const quantity = quantityFor(product.id);
              const available = product.stock > 0;
              const low = product.stock > 0 && product.stock <= 5;
              return <Card key={product.id} className="group overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"><CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{product.category}</p><h3 className="mt-1 min-h-10 text-sm font-semibold leading-snug">{product.name}</h3></div><Badge variant={available ? "outline" : "destructive"} className={available ? low ? "shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "shrink-0"}>{available ? `${product.stock} un` : "Esgotado"}</Badge></div>
                <div className="flex items-center justify-between border-t pt-3"><div><p className="text-[11px] text-muted-foreground">Valor unitário</p><strong className="font-serif text-lg">{brl(product.price)}</strong></div>{quantity ? <div className="flex items-center gap-1"><Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => setQuantity(`product:${product.id}`, quantity - 1)} aria-label={`Diminuir ${product.name}`}><Minus className="h-3.5 w-3.5" /></Button><span className="w-6 text-center text-sm font-bold">{quantity}</span><Button size="icon" className="h-9 w-9 rounded-full" disabled={quantity >= product.stock} onClick={() => addProduct(product)} aria-label={`Adicionar ${product.name}`}><Plus className="h-3.5 w-3.5" /></Button></div> : <Button size="sm" className="gap-1.5" disabled={!available} onClick={() => addProduct(product)}><Plus className="h-3.5 w-3.5" />Adicionar</Button>}</div>
              </CardContent></Card>;
            })}
          </div>
        </div>

        <Card className="h-fit border-primary/20 shadow-soft lg:sticky lg:top-6"><CardHeader className="border-b bg-primary/5"><CardTitle className="flex items-center justify-between text-base"><span>Carrinho</span><span className="flex items-center gap-1.5 text-sm text-primary"><ShoppingCart className="h-4 w-4" />{itemCount}</span></CardTitle><CardDescription>Revise todos os serviços, kits e produtos em um único pedido.</CardDescription></CardHeader><CardContent className="space-y-4 p-4"><div className="max-h-56 space-y-3 overflow-auto pr-1">{items.length ? items.map((item) => <div key={`${item.id}-${item.authorizationCode || ""}`} className="flex justify-between gap-2 text-xs"><span className="leading-relaxed">{item.quantity}× {item.name}</span><strong className="shrink-0">{brl(item.quantity * item.unitPrice)}</strong></div>) : <div className="py-7 text-center text-xs text-muted-foreground"><ShoppingCart className="mx-auto mb-2 h-5 w-5 opacity-50" />Seu carrinho está vazio.</div>}</div><div className="flex justify-between border-t pt-3 text-sm"><span>Total do pedido</span><strong className="font-serif text-lg">{brl(total)}</strong></div><Button className="w-full" asChild><a href="/hospede/carrinho"><PackageCheck className="mr-2 h-4 w-4" />Revisar pedido</a></Button></CardContent></Card>
      </div>
    </DashboardShell>
  );
}
