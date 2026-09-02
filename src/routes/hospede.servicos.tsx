import { createFileRoute } from "@tanstack/react-router";
import { Flame, Info, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { priceFor, useMyReservation, usePricing, useServices } from "@/lib/api";
import { guestNav } from "@/lib/nav";
import { propertyTypeLabelFromCode } from "@/lib/property";

export const Route = createFileRoute("/hospede/servicos")({ component: HospedeServicosPage });

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HospedeServicosPage() {
  const { data: services = [], isLoading: loadingServices } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const { items, addItem, setQuantity, itemCount } = useGuestCart();
  const { data: activeReservation } = useMyReservation();
  const [propertyCode, setPropertyCode] = useState("");
  const code = propertyCode.trim() || null;

  useEffect(() => {
    if (!activeReservation) return;
    const apartment = Array.isArray(activeReservation.apartments) ? activeReservation.apartments[0] : activeReservation.apartments;
    if (apartment?.code) setPropertyCode(apartment.code);
  }, [activeReservation]);

  const addService = (service: (typeof services)[number], quantity: number) => {
    if (service.price_by_property && !code) {
      toast.error("Informe o código do imóvel para calcular o valor deste serviço.");
      return;
    }
    addItem({
      id: `service:${service.key}:${code ?? "geral"}`,
      name: service.name,
      category: service.category as any,
      unitPrice: priceFor(pricing, service.key, code),
      serviceKey: service.key,
      authorizationCode: code ?? undefined,
    }, quantity);
    toast.success(`${service.name} adicionado ao carrinho.`);
  };

  return (
    <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Serviços & comodidades" subtitle="O código do imóvel é preenchido pela reserva ativa e define automaticamente o valor correto dos serviços.">
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <Label htmlFor="property-code" className="text-xs">Código do imóvel (opcional para itens de preço único)</Label>
                <Input id="property-code" value={propertyCode} onChange={(event) => setPropertyCode(event.target.value.toUpperCase())} placeholder="Ex.: S101" className="mt-1 h-9 max-w-[10rem] font-mono uppercase" />
                {code && <p className="mt-1 text-xs text-muted-foreground">{propertyTypeLabelFromCode(code)}</p>}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/hospede/carrinho"><ShoppingCart className="mr-2 h-4 w-4" /> Carrinho ({itemCount})</a>
            </Button>
          </CardContent>
        </Card>

        {loadingServices ? <p className="text-sm text-muted-foreground">Carregando serviços…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => {
              const price = priceFor(pricing, service.key, code);
              const needsPropertyPrice = service.price_by_property && !code;
              const Icon = service.key === "aquecedor_portatil" ? Flame : Sparkles;
              const cartId = `service:${service.key}:${code ?? "geral"}`;
              const quantity = items.find((item) => item.id === cartId)?.quantity || 0;

              return (
                <Card key={service.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                      <div className="text-right">
                        {needsPropertyPrice ? <p className="text-xs italic text-muted-foreground">Informe o código do imóvel para ver o valor</p> : <><strong className="text-lg">{brl(price)}</strong><p className="text-[10px] text-muted-foreground">por {service.unit}</p></>}
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">{service.name}</CardTitle>
                    <CardDescription className="text-xs">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between gap-3">
                    {quantity > 0 ? (
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(cartId, quantity - 1)} disabled={needsPropertyPrice} aria-label={`Diminuir ${service.name}`}><Minus className="h-3.5 w-3.5" /></Button>
                        <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(cartId, quantity + 1)} disabled={needsPropertyPrice} aria-label={`Aumentar ${service.name}`}><Plus className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhum no carrinho</span>
                    )}
                    <Button type="button" size="sm" onClick={() => addService(service, 1)} disabled={needsPropertyPrice}>{quantity > 0 ? "Adicionar mais" : "Adicionar"}</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {itemCount > 0 && <a href="/hospede/carrinho" className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl lg:hidden"><ShoppingCart className="h-4 w-4" /> Carrinho ({itemCount})</a>}
    </DashboardShell>
  );
}

