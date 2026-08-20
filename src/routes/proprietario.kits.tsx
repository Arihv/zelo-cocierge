import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { priceFor, usePricing, useServices } from "@/lib/api";
import { ownerNav } from "@/lib/nav";

export const Route = createFileRoute("/proprietario/kits")({ component: ProprietarioKits });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ProprietarioKits() {
  const { data: catalog = [], isLoading } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const kits = catalog.filter((service) => service.category === "kit");
  return <DashboardShell nav={ownerNav} role="Proprietário" logoutTo="/proprietario/login" title="Kits & cardápio" subtitle="Visualize os kits e valores disponíveis para hóspedes. A gestão é feita pela administração.">
    <div className="mx-auto max-w-5xl space-y-5 text-left"><div className="rounded-xl border bg-secondary/60 p-4 text-sm text-muted-foreground">Visão somente leitura. Alterações de kits, preços e disponibilidade são centralizadas na administração e aparecem aqui automaticamente.</div>{isLoading ? <p className="text-sm text-muted-foreground">Carregando catálogo…</p> : kits.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum kit disponível no momento.</CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kits.map((kit) => <Card key={kit.id}><CardHeader><div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div><Badge variant="outline">Disponível</Badge></div><CardTitle className="mt-2 text-base">{kit.name}</CardTitle><CardDescription className="whitespace-pre-line text-xs">{kit.description}</CardDescription></CardHeader><CardContent className="border-t pt-4"><strong>{brl(priceFor(pricing, kit.key))}</strong><span className="ml-1 text-xs text-muted-foreground">por kit</span></CardContent></Card>)}</div>}</div>
  </DashboardShell>;
}
