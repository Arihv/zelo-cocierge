import { createFileRoute } from "@tanstack/react-router";
import { Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { priceFor, usePricing, useServices } from "@/lib/api";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/kits")({ component: HospedeKitsPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HospedeKitsPage() {
  const { data: catalog = [], isLoading } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const { items, addItem, itemCount } = useGuestCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const kits = catalog.filter((service) => service.category === "kit");
  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Kits de café & refeição" subtitle="Kits e valores definidos pela administração. Escolha quantidades e pague tudo de uma vez.">
    <div className="mx-auto max-w-6xl space-y-6"><div className="flex justify-end"><Button asChild variant="outline"><a href="/hospede/carrinho"><ShoppingCart className="mr-2 h-4 w-4" /> Carrinho ({itemCount})</a></Button></div>{isLoading ? <p className="text-sm text-muted-foreground">Carregando kits…</p> : kits.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">A administração ainda não cadastrou kits disponíveis.</CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kits.map((kit) => { const quantity = quantities[kit.key] || 1; const price = priceFor(pricing, kit.key); const inCart = items.find((item) => item.id === `kit:${kit.key}`)?.quantity || 0; return <Card key={kit.id}><CardHeader><div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div><strong>{brl(price)}</strong></div><CardTitle className="mt-2 text-base">{kit.name}</CardTitle><CardDescription className="whitespace-pre-line text-xs">{kit.description}</CardDescription></CardHeader><CardContent className="flex items-center justify-between border-t pt-4"><div className="flex items-center gap-2"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantities((current) => ({ ...current, [kit.key]: Math.max(1, quantity - 1) }))}><Minus className="h-3.5 w-3.5" /></Button><span className="w-5 text-center text-sm font-semibold">{quantity}</span><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantities((current) => ({ ...current, [kit.key]: quantity + 1 }))}><Plus className="h-3.5 w-3.5" /></Button></div><Button size="sm" onClick={() => { addItem({ id: `kit:${kit.key}`, name: kit.name, category: "kit", unitPrice: price, serviceKey: kit.key }, quantity); toast.success(`${kit.name} adicionado ao carrinho.`); }}>Adicionar{inCart ? ` (${inCart})` : ""}</Button></CardContent></Card>; })}</div>}</div>
  </DashboardShell>;
}
