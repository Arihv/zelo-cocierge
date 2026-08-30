import { Link, createFileRoute } from "@tanstack/react-router";
import { Building2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerCart } from "@/hooks/use-owner-cart";
import { useApartments, useCreateOrder, useSiteSettings } from "@/lib/api";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";
import { ownerNav } from "@/lib/nav";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/proprietario/carrinho")({ component: ProprietarioCarrinhoPage });

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function ProprietarioCarrinhoPage() {
  const { items, itemCount, total, removeItem, setQuantity, clear } = useOwnerCart();
  const { data: apartments = [], isLoading: apartmentsLoading } = useApartments(true);
  const { data: siteSettings } = useSiteSettings();
  const minOrder = siteSettings?.minimumOrderAmount ?? 0;
  const createOrder = useCreateOrder();
  const { user, profile } = useAuth();
  const [selectedApartmentId, setSelectedApartmentId] = useState("");
  const selectedApartment = apartments.find((apartment) => apartment.id === selectedApartmentId);
  const hasMarketItem = items.some((item) => item.category === "mercado");

  const checkout = async () => {
    if (!items.length) return;
    if (!selectedApartment) return toast.error("Selecione o imóvel que receberá este pedido.");
    const hasMarketItem = items.some((item) => item.category === "mercado");
    if (hasMarketItem && total < minOrder) return toast.error(`O pedido mínimo do mercado é de ${brl(minOrder)}.`);
    if (!user) return toast.error("Faça login novamente para continuar.");
    try {
      const category = items.every((item) => item.category === "kit") ? "kit" : "mercado";
      const order = await createOrder.mutateAsync({
        category,
        total,
        customerName: profile?.full_name?.trim() || undefined,
        customerEmail: user.email?.trim() || undefined,
        customerPhone: profile?.phone?.trim() || undefined,
        apartmentId: selectedApartment.id,
        details: JSON.stringify({ source: "owner_cart", apartment_code: selectedApartment.code, apartment_name: selectedApartment.name, item_count: itemCount }),
        items: items.map((item) => ({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, service_key: item.serviceKey || (item.productId ? `product:${item.productId}` : undefined) })),
      });
      await openMercadoPagoCheckout(order.id);
      clear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
    }
  };

  return (
    <DashboardShell nav={ownerNav} role="Proprietário" logoutTo="/proprietario/login" title="Carrinho do minimercado" subtitle="Revise os itens e escolha o imóvel que receberá o pedido.">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Itens selecionados ({itemCount})</CardTitle><CardDescription>O pedido será enviado à administração e seguirá para pagamento.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><p className="text-muted-foreground">Seu carrinho está vazio.</p><Button asChild className="mt-4"><Link to="/proprietario/mercado">Voltar ao mercado</Link></Button></div> : items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{brl(item.unitPrice)} por unidade</p></div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="flex items-center rounded-lg border"><Button variant="ghost" size="icon" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Diminuir quantidade"><Minus className="h-4 w-4" /></Button><span className="min-w-9 text-center font-semibold">{item.quantity}</span><Button variant="ghost" size="icon" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Aumentar quantidade"><Plus className="h-4 w-4" /></Button></div>
                  <p className="min-w-20 text-right font-semibold">{brl(item.unitPrice * item.quantity)}</p>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remover item"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>Entrega e pagamento</CardTitle><CardDescription>Defina o imóvel antes de confirmar o pedido.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><label htmlFor="owner-order-apartment" className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4" /> Imóvel de entrega</label><select id="owner-order-apartment" value={selectedApartmentId} onChange={(event) => setSelectedApartmentId(event.target.value)} disabled={apartmentsLoading || apartments.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{apartmentsLoading ? "Carregando imóveis..." : "Selecione um imóvel"}</option>{apartments.map((apartment) => <option key={apartment.id} value={apartment.id}>{apartment.code} — {apartment.name}</option>)}</select>{!apartmentsLoading && apartments.length === 0 && <p className="text-sm text-destructive">Nenhum imóvel está vinculado à sua conta.</p>}</div>
            <div className="space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Itens</span><span>{itemCount}</span></div><div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{brl(total)}</span></div>{hasMarketItem && total < minOrder && <p className="text-xs text-amber-700 dark:text-amber-300">Faltam {brl(minOrder - total)} para atingir o pedido mínimo de {brl(minOrder)}.</p>}</div>
            <Button className="w-full" disabled={!items.length || !selectedApartmentId || (hasMarketItem && total < minOrder) || createOrder.isPending} onClick={checkout}><ShoppingCart className="mr-2 h-4 w-4" /> {createOrder.isPending ? "Preparando pagamento..." : "Ir para pagamento"}</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
