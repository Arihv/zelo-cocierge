import { Link, createFileRoute } from "@tanstack/react-router";
import { Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerCart } from "@/hooks/use-owner-cart";
import { priceFor, usePricing, useServices } from "@/lib/api";
import { ownerNav } from "@/lib/nav";

export const Route = createFileRoute("/proprietario/kits")({ component: ProprietarioKits });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ProprietarioKits() {
  const { data: catalog = [], isLoading } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const { items, addItem, setQuantity, itemCount } = useOwnerCart();
  const kits = catalog.filter((service) => service.category === "kit");
  return <DashboardShell nav={ownerNav} role="Proprietário" logoutTo="/proprietario/login" title="Kits & cardápio" subtitle="Compre kits para os seus imóveis. Preços definidos pela administração.">
    <div className="mx-auto max-w-6xl space-y-6 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Selecione os kits e escolha o imóvel de entrega no carrinho.</p>
        <Button asChild><Link to="/proprietario/carrinho"><ShoppingCart className="mr-2 h-4 w-4" /> Carrinho ({itemCount})</Link></Button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando catálogo…</p> : kits.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum kit disponível no momento.</CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kits.map((kit) => {
        const price = priceFor(pricing, kit.key);
        const cartId = `owner-kit-${kit.key}`;
        const quantity = items.find((item) => item.id === cartId)?.quantity || 0;
        return <Card key={kit.id}><CardHeader><div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div><strong>{brl(price)}</strong></div><CardTitle className="mt-2 text-base">{kit.name}</CardTitle><CardDescription className="whitespace-pre-line text-xs">{kit.description}</CardDescription></CardHeader><CardContent className="flex items-center justify-between border-t pt-4">{quantity > 0 ? <div className="flex items-center gap-2"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(cartId, quantity - 1)} aria-label={`Diminuir ${kit.name}`}><Minus className="h-3.5 w-3.5" /></Button><span className="w-6 text-center text-sm font-semibold">{quantity}</span><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(cartId, quantity + 1)} aria-label={`Aumentar ${kit.name}`}><Plus className="h-3.5 w-3.5" /></Button></div> : <span className="text-xs text-muted-foreground">Nenhum no carrinho</span>}<Button size="sm" onClick={() => { addItem({ id: cartId, name: kit.name, category: "kit", unitPrice: price, serviceKey: kit.key }, 1); toast.success(`${kit.name} adicionado ao carrinho.`); }}>{quantity > 0 ? "Adicionar mais" : "Adicionar"}</Button></CardContent></Card>;
      })}</div>}
    </div>
  </DashboardShell>;
}
