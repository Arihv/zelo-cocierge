import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { type MarketProduct, useMarketStore } from "@/hooks/use-market-store";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/mercado")({ component: HospedeMercadoPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HospedeMercadoPage() {
  const { products, categories, minOrder } = useMarketStore();
  const { items, addItem, setQuantity, itemCount, total } = useGuestCart();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const marketItems = items.filter((item) => item.productId);
  const filteredProducts = products.filter((product) => (selectedCategory === "Todas" || product.category === selectedCategory) && product.name.toLowerCase().includes(search.toLowerCase()));
  const quantityFor = (productId: string) => marketItems.find((item) => item.productId === productId)?.quantity || 0;
  const addProduct = (product: MarketProduct) => {
    const quantity = quantityFor(product.id);
    if (quantity >= product.stock) { toast.error(`Estoque máximo atingido para ${product.name}.`); return; }
    addItem({ id: `product:${product.id}`, name: product.name, category: "mercado", unitPrice: product.price, productId: product.id });
  };
  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Minimercado de conveniência" subtitle={`Itens entregues no imóvel vinculado à sua reserva. Pedido mínimo do mercado: ${brl(minOrder)}.`}>
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr,280px]"><div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar itens no mercado…" /></div></div><div className="flex gap-2 overflow-x-auto pb-1">{["Todas", ...categories].map((category) => <Button key={category} size="sm" variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)}>{category}</Button>)}</div><div className="grid gap-3 sm:grid-cols-2">{filteredProducts.map((product) => { const quantity = quantityFor(product.id); const available = product.stock > 0; return <Card key={product.id}><CardContent className="space-y-3 p-4"><div className="flex justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{product.category}</p><h3 className="text-sm font-semibold">{product.name}</h3></div><Badge variant={available ? "outline" : "destructive"}>{available ? `${product.stock} un` : "Esgotado"}</Badge></div><div className="flex items-center justify-between border-t pt-3"><strong>{brl(product.price)}</strong>{quantity ? <div className="flex items-center gap-2"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(`product:${product.id}`, quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button><span className="w-5 text-center text-sm font-semibold">{quantity}</span><Button size="icon" className="h-8 w-8" disabled={quantity >= product.stock} onClick={() => addProduct(product)}><Plus className="h-3.5 w-3.5" /></Button></div> : <Button size="sm" disabled={!available} onClick={() => addProduct(product)}><Plus className="mr-1 h-3.5 w-3.5" />Adicionar</Button>}</div></CardContent></Card>; })}</div></div>
      <Card className="h-fit lg:sticky lg:top-6"><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>Carrinho ({itemCount})</span><ShoppingCart className="h-4 w-4 text-primary" /></CardTitle><CardDescription>Serviços e kits adicionados em outras abas aparecem aqui.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="max-h-48 space-y-2 overflow-auto">{items.length ? items.map((item) => <div key={`${item.id}-${item.authorizationCode || ""}`} className="flex justify-between gap-2 text-xs"><span>{item.quantity}× {item.name}</span><strong>{brl(item.quantity * item.unitPrice)}</strong></div>) : <p className="py-4 text-center text-xs text-muted-foreground">Seu carrinho está vazio.</p>}</div><div className="flex justify-between border-t pt-3 text-sm"><span>Total</span><strong>{brl(total)}</strong></div><Button className="w-full" asChild><a href="/hospede/carrinho"><ShoppingCart className="mr-2 h-4 w-4" />Revisar e pagar</a></Button></CardContent></Card>
    </div>
  </DashboardShell>;
}
