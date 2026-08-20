import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";
import { guestNav } from "@/lib/nav";
import { useCreateOrder, useMyReservation } from "@/lib/api";

export const Route = createFileRoute("/hospede/carrinho")({ component: GuestCartPage });

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function GuestCartPage() {
  const { items, itemCount, total, setQuantity, removeItem, clear } = useGuestCart();
  const { data: reservation, isLoading: reservationLoading } = useMyReservation();
  const createOrder = useCreateOrder();

  const checkout = async () => {
    if (!reservation) { toast.error("Sua reserva ativa não foi encontrada."); return; }
    if (!items.length) return;
    try {
      const order = await createOrder.mutateAsync({
        category: "servico",
        total,
        details: JSON.stringify({ source: "guest_cart", item_count: itemCount }),
        apartmentId: reservation.apartment_id,
        reservationId: reservation.id,
        items: items.map((item) => ({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, service_key: item.serviceKey || item.productId ? (item.serviceKey || `product:${item.productId}`) : undefined })),
      });
      await openMercadoPagoCheckout(order.id);
      clear();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento."); }
  };

  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Meu carrinho" subtitle="Revise todos os serviços, kits e itens de mercado antes de realizar um único pagamento.">
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr,320px]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Itens selecionados</CardTitle><CardDescription>O carrinho não guarda nome, e-mail ou dados de pagamento no navegador.</CardDescription></CardHeader><CardContent>{items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p> : <div className="divide-y">{items.map((item) => <div key={`${item.id}-${item.authorizationCode || ""}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{brl(item.unitPrice)} por unidade{item.authorizationCode ? " · autorização registrada" : ""}</p></div><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button><span className="w-6 text-center text-sm font-semibold">{item.quantity}</span><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button></div><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button><strong className="w-20 text-right text-sm">{brl(item.unitPrice * item.quantity)}</strong></div></div>)}</div>}</CardContent></Card>
      <Card className="h-fit"><CardHeader><CardTitle>Resumo</CardTitle><CardDescription>{itemCount} {itemCount === 1 ? "item" : "itens"}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between border-y py-4"><span>Total</span><strong className="font-serif text-2xl">{brl(total)}</strong></div><p className="text-xs text-muted-foreground">A reserva e o imóvel são confirmados pelo sistema. O pagamento é feito exclusivamente no Mercado Pago.</p><Button className="w-full gap-2" disabled={!items.length || reservationLoading || createOrder.isPending} onClick={() => void checkout()}><ShoppingCart className="h-4 w-4" /> {createOrder.isPending ? "Preparando…" : "Ir para pagamento"}</Button></CardContent></Card>
    </div>
  </DashboardShell>;
}
