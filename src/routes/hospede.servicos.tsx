import { createFileRoute } from "@tanstack/react-router";
import { Flame, Info, LockKeyhole, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { supabase } from "@/integrations/supabase/client";
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
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [validatedPropertyCode, setValidatedPropertyCode] = useState<string | null>(null);
  const code = reservation?.apartments?.code ?? validatedPropertyCode;

  const validateCode = async (serviceKey: string) => {
    const value = codes[serviceKey]?.trim();
    if (!value) {
      toast.error("Informe o código fornecido pela administração.");
      return;
    }

    try {
      const result = await linkReservation.mutateAsync(value);
      const reservationId = result?.[0]?.reservation_id;

      // The query cache may refresh a moment after the RPC. Fetch the linked
      // apartment now so pricing is never calculated with a zero value.
      if (reservationId) {
        const { data: linkedReservation, error } = await supabase
          .from("reservations")
          .select("apartments(code)")
          .eq("id", reservationId)
          .maybeSingle();

        if (error) throw error;

        const apartment = (linkedReservation as { apartments?: { code?: string | null } | null } | null)?.apartments;
        setValidatedPropertyCode(apartment?.code ?? null);
      }

      setUnlocked((current) => ({ ...current, [serviceKey]: true }));
      toast.success("Código validado. Você já pode adicionar este serviço.");
    } catch (error) {
      setUnlocked((current) => ({ ...current, [serviceKey]: false }));
      toast.error(error instanceof Error ? error.message : "Código inválido ou indisponível.");
    }
  };

  const addService = (service: (typeof services)[number], quantity: number) => {
    if (!unlocked[service.key]) {
      toast.error("Valide o código deste serviço antes de adicionar ao carrinho.");
      return;
    }

    const authorizationCode = codes[service.key]?.trim().toUpperCase();
    addItem({
      id: `service:${service.key}:${authorizationCode}`,
      name: service.name,
      category: service.category as any,
      unitPrice: priceFor(pricing, service.key, code),
      serviceKey: service.key,
      authorizationCode,
    }, quantity);
    toast.success(`${service.name} adicionado ao carrinho.`);
  };

  return (
    <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Serviços & comodidades" subtitle="Informe o código fornecido pela administração para validar e solicitar cada serviço.">
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm">
                {code ? <>Reserva vinculada ao imóvel <strong>{code}</strong> · {propertyTypeLabelFromCode(code)}.</> : "Informe o código em cada serviço para vincular sua estadia e calcular o valor correto."}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/hospede/carrinho"><ShoppingCart className="mr-2 h-4 w-4" /> Carrinho ({itemCount})</a>
            </Button>
          </CardContent>
        </Card>

        {(loadingReservation || loadingServices) ? <p className="text-sm text-muted-foreground">Carregando serviços…</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => {
              const isUnlocked = !!unlocked[service.key];
              const price = priceFor(pricing, service.key, code);
              const needsPropertyPrice = service.price_by_property && !code;
              const Icon = service.key === "aquecedor_portatil" ? Flame : Sparkles;

              return (
                <Card key={service.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                      <div className="text-right">
                        {needsPropertyPrice ? <p className="text-xs italic text-muted-foreground">Valide o código para ver o valor</p> : <><strong className="text-lg">{brl(price)}</strong><p className="text-[10px] text-muted-foreground">por {service.unit}</p></>}
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">{service.name}</CardTitle>
                    <CardDescription className="text-xs">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs"><LockKeyhole className="h-3 w-3" /> Código do imóvel ou da reserva</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={codes[service.key] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value.toUpperCase();
                            setCodes((current) => ({ ...current, [service.key]: value }));
                            setUnlocked((current) => ({ ...current, [service.key]: false }));
                          }}
                          placeholder="EX.: S-102 ou RES-AB12CD"
                          className="h-9 font-mono text-xs uppercase"
                          disabled={linkReservation.isPending}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => void validateCode(service.key)} disabled={linkReservation.isPending}>
                          {linkReservation.isPending ? "Validando…" : "Validar"}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Use somente o código enviado pela administração. O card permanece bloqueado até a validação.</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant={isUnlocked ? "default" : "outline"}>{isUnlocked ? "Código validado" : "Aguardando validação"}</Badge>
                      <QuantityAdd disabled={!isUnlocked} onAdd={(quantity) => addService(service, quantity)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function QuantityAdd({ disabled, onAdd }: { disabled: boolean; onAdd: (quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  return <div className="flex items-center gap-2">
    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={disabled}><Minus className="h-3.5 w-3.5" /></Button>
    <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity((value) => value + 1)} disabled={disabled}><Plus className="h-3.5 w-3.5" /></Button>
    <Button type="button" size="sm" onClick={() => onAdd(quantity)} disabled={disabled}>Adicionar</Button>
  </div>;
}
