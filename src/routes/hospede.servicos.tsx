import { createFileRoute } from "@tanstack/react-router";
import { Flame, Info, KeyRound, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { priceFor, useLinkReservation, useMyReservation, usePricing, useServices } from "@/lib/api";
import { guestNav } from "@/lib/nav";
import { propertyTypeLabelFromCode } from "@/lib/property";

export const Route = createFileRoute("/hospede/servicos")({ component: HospedeServicosPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HospedeServicosPage() {
  const { data: reservation, isLoading: loadingReservation } = useMyReservation();
  const { data: services = [], isLoading: loadingServices } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const linkReservation = useLinkReservation();
  const { addItem, itemCount } = useGuestCart();
  const [authorization, setAuthorization] = useState<Record<string, string>>({});
  const [reservationCode, setReservationCode] = useState("");
  const code = reservation?.apartments?.code ?? null;

  const addService = (service: (typeof services)[number], quantity: number) => {
    const requiresAuthorization = service.key === "aquecedor_portatil";
    const authorizationCode = authorization[service.key]?.trim();
    if (requiresAuthorization && !authorizationCode) { toast.error("Informe o código de autorização fornecido pela administração."); return; }
    addItem({ id: `service:${service.key}${authorizationCode ? `:${authorizationCode}` : ""}`, name: service.name, category: service.category as any, unitPrice: priceFor(pricing, service.key, code), serviceKey: service.key, authorizationCode }, quantity);
    toast.success(`${service.name} adicionado ao carrinho.`);
  };
  const unlock = async () => {
    if (!reservationCode.trim()) { toast.error("Informe o código de reserva fornecido pela administração."); return; }
    try { await linkReservation.mutateAsync(reservationCode.trim()); toast.success("Estadia vinculada. Os serviços foram liberados."); setReservationCode(""); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Código inválido ou indisponível."); }
  };

  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Serviços & comodidades" subtitle="Valores definidos pela administração e calculados automaticamente para o seu imóvel.">
    <div className="mx-auto max-w-5xl space-y-6 text-left"><Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Info className="h-5 w-5 text-primary" /><p className="text-sm">{code ? <>Valores do imóvel <strong>{code}</strong> · {propertyTypeLabelFromCode(code)}.</> : "Nenhuma reserva ativa vinculada à sua conta."}</p></div><Button variant="outline" size="sm" asChild><a href="/hospede/carrinho"><ShoppingCart className="mr-2 h-4 w-4" /> Carrinho ({itemCount})</a></Button></CardContent></Card>
      {(loadingReservation || loadingServices) ? <p className="text-sm text-muted-foreground">Carregando serviços…</p> : !reservation ? <Card className="mx-auto max-w-xl"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Liberar serviços da estadia</CardTitle><CardDescription>Os cards ficam bloqueados até que você informe o código de reserva enviado pela administração.</CardDescription></CardHeader><CardContent className="space-y-3"><Label htmlFor="reservation-code">Código de reserva</Label><div className="flex gap-2"><Input id="reservation-code" value={reservationCode} onChange={(event) => setReservationCode(event.target.value.toUpperCase())} placeholder="EX.: RES-AB12CD" className="font-mono uppercase" /><Button onClick={() => void unlock()} disabled={linkReservation.isPending}>{linkReservation.isPending ? "Validando…" : "Validar código"}</Button></div><p className="text-xs text-muted-foreground">Não use S, D ou T como senha. Esses são apenas padrões internos de preço e serão identificados após a validação.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{services.map((service) => { const price = priceFor(pricing, service.key, code); const needsCode = service.key === "aquecedor_portatil"; return <Card key={service.id} className="flex flex-col"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary">{needsCode ? <Flame className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div><div className="text-right"><strong className="text-lg">{brl(price)}</strong><p className="text-[10px] text-muted-foreground">por {service.unit}</p></div></div><CardTitle className="mt-2 text-base">{service.name}</CardTitle><CardDescription className="text-xs">{service.description}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3">{needsCode && <div className="space-y-1"><Label className="text-xs">Código de autorização</Label><Input value={authorization[service.key] || ""} onChange={(event) => setAuthorization((current) => ({ ...current, [service.key]: event.target.value.toUpperCase() }))} placeholder="FORNECIDO PELA ADMINISTRAÇÃO" className="h-9 text-xs" /></div>}<div className="flex items-center justify-between gap-3"><Badge variant="outline">{service.price_by_property ? `Preço ${code?.charAt(0) || "—"}` : "Preço padrão"}</Badge><QuantityAdd onAdd={(quantity) => addService(service, quantity)} /></div></CardContent></Card>; })}</div>}</div>
  </DashboardShell>;
}

function QuantityAdd({ onAdd }: { onAdd: (quantity: number) => void }) { const [quantity, setQuantity] = useState(1); return <div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="h-3.5 w-3.5" /></Button><span className="w-5 text-center text-sm font-semibold">{quantity}</span><Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((value) => value + 1)}><Plus className="h-3.5 w-3.5" /></Button><Button type="button" size="sm" onClick={() => onAdd(quantity)}>Adicionar</Button></div>; }
