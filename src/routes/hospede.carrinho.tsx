import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2, UserRound, CreditCard, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";
import { guestNav } from "@/lib/nav";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder, useMyReservation } from "@/lib/api";

export const Route = createFileRoute("/hospede/carrinho")({ component: GuestCartPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const onlyDigits = (value: string) => value.replace(/\D/g, "");
const validCpf = (value: string) => { const cpf = onlyDigits(value); if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== Number(cpf[9])) return false; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0; return d2 === Number(cpf[10]); };

function GuestCartPage() {
  const { user, profile } = useAuth();
  const { items, itemCount, total, setQuantity, removeItem, setObservation, clear } = useGuestCart();
  const { data: reservation, isLoading: reservationLoading } = useMyReservation();
  const createOrder = useCreateOrder();
  const [name, setName] = useState(""); const [cpf, setCpf] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  useEffect(() => { setName(profile?.full_name || reservation?.guest_name || ""); setPhone(profile?.phone || reservation?.guest_phone || ""); setEmail(user?.email || ""); }, [profile, reservation, user]);
  const apartmentCode = reservation?.apartments?.code || reservation?.apartment_id || "";
  const checkout = async () => {
    if (!reservation) { toast.error("Sua reserva ativa não foi encontrada."); return; }
    if (!items.length) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !cpf.trim()) { toast.error("Preencha nome, CPF, e-mail e telefone para continuar."); return; }
    if (!validCpf(cpf)) { toast.error("Confira o CPF informado."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Confira o e-mail informado."); return; }
    try {
      const order = await createOrder.mutateAsync({ category: "servico", total, customerName: name.trim(), customerCpf: onlyDigits(cpf), customerEmail: email.trim(), customerPhone: phone.trim(), apartmentId: reservation.apartment_id, reservationId: reservation.id, details: JSON.stringify({ source: "guest_cart", item_count: itemCount, apartment_code: apartmentCode }), items: items.map((item) => ({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, observation: item.observation?.trim() || undefined, service_key: item.serviceKey || (item.productId ? `product:${item.productId}` : undefined) })) });
      await openMercadoPagoCheckout(order.id); clear();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento."); }
  };
  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Meu carrinho" subtitle="Revise todos os serviços, kits e itens de mercado antes de realizar um único pagamento.">
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr,320px]"><div className="space-y-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Itens selecionados</CardTitle><CardDescription>Informe detalhes de cada item, como sabor ou marca desejada.</CardDescription></CardHeader><CardContent>{items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p> : <div className="divide-y">{items.map((item) => <div key={`${item.id}-${item.authorizationCode || ""}`} className="space-y-3 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{brl(item.unitPrice)} por unidade{item.authorizationCode ? " · autorização registrada" : ""}</p></div><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button><span className="w-6 text-center text-sm font-semibold">{item.quantity}</span><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button></div><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button><strong className="w-20 text-right text-sm">{brl(item.unitPrice * item.quantity)}</strong></div></div><div className="space-y-1.5"><Label className="flex items-center gap-1.5 text-xs"><MessageSquareText className="h-3.5 w-3.5 text-primary" /> Observação do item (opcional)</Label><Input value={item.observation || ""} onChange={(e) => setObservation(item.id, e.target.value)} placeholder="Ex.: Lacta branco ou Bis branco" className="mt-1" /></div></div>)}</div>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Dados para identificação e cobrança</CardTitle><CardDescription>Os dados ficam registrados no pedido para conferência e segurança caso o pagamento não seja confirmado.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Nome completo *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do hóspede" className="mt-1" /></div><div><Label>CPF *</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" placeholder="000.000.000-00" className="mt-1" /></div><div><Label>Código do apartamento</Label><Input value={apartmentCode} readOnly className="mt-1 bg-muted/40" /></div><div><Label>E-mail *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" className="mt-1" /></div><div><Label>Telefone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(00) 00000-0000" className="mt-1" /></div></CardContent></Card>
    </div><Card className="h-fit"><CardHeader><CardTitle>Resumo</CardTitle><CardDescription>{itemCount} {itemCount === 1 ? "item" : "itens"}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between border-y py-4"><span>Total</span><strong className="font-serif text-2xl">{brl(total)}</strong></div><p className="text-xs text-muted-foreground">O pedido é registrado antes do Mercado Pago. Se não for aprovado, continua no Histórico para nova cobrança.</p><Button className="w-full gap-2" disabled={!items.length || reservationLoading || createOrder.isPending} onClick={() => void checkout()}><CreditCard className="h-4 w-4" /> {createOrder.isPending ? "Preparando…" : "Ir para pagamento"}</Button></CardContent></Card></div>
  </DashboardShell>;
}
