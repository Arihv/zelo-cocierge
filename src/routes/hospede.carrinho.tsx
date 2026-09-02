import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2, UserRound, CreditCard, MessageSquareText, CalendarDays, Home } from "lucide-react";
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
import { useCreateOrder, useMyReservation, useSiteSettings } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hospede/carrinho")({ component: GuestCartPage });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const onlyDigits = (value: string) => value.replace(/\D/g, "");
const validCpf = (value: string) => { const cpf = onlyDigits(value); if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== Number(cpf[9])) return false; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0; return d2 === Number(cpf[10]); };
const formatDate = (value?: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

function GuestCartPage() {
  const { user, profile, refresh } = useAuth();
  const { items, itemCount, total, setQuantity, removeItem, setObservation, clear } = useGuestCart();
  const createOrder = useCreateOrder();
  const { data: activeReservation, isLoading: reservationLoading } = useMyReservation();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const { data: siteSettings } = useSiteSettings();
  const minimumOrder = siteSettings?.minimumOrderAmount ?? 0;
  const deliveryFee = siteSettings?.deliveryFee ?? 0;
  const apartment = activeReservation ? (Array.isArray(activeReservation.apartments) ? activeReservation.apartments[0] : activeReservation.apartments) : null;

  useEffect(() => {
    setName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setEmail(user?.email || "");
    setCpf(profile?.cpf || "");
  }, [profile, user]);

  useEffect(() => {
    if (!activeReservation?.guest_name || name) return;
    setName(activeReservation.guest_name);
  }, [activeReservation, name]);

  useEffect(() => {
    if (!user) return;
    const pendingKey = `zelo_guest_pending_payment_${user.id}`;
    const pendingOrderId = localStorage.getItem(pendingKey);
    if (!pendingOrderId) return;

    void (async () => {
      const { data } = await supabase.from("orders").select("payment_status").eq("id", pendingOrderId).maybeSingle();
      if (data?.payment_status === "approved") {
        clear();
        localStorage.removeItem(pendingKey);
        toast.success("Pagamento confirmado. Carrinho finalizado com sucesso.");
      }
    })();
  }, [user, clear]);

  const saveProfileData = async (showFeedback = false) => {
    if (!user) return true;
    const cleanCpf = onlyDigits(cpf);
    if (!name.trim() || !phone.trim() || cleanCpf.length !== 11 || !validCpf(cleanCpf)) return false;

    const alreadySaved =
      (profile?.full_name || "").trim() === name.trim()
      && (profile?.phone || "").trim() === phone.trim()
      && onlyDigits(profile?.cpf || "") === cleanCpf;
    if (alreadySaved) return true;

    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim(), cpf: cleanCpf }).eq("id", user.id);
    if (error) {
      if (showFeedback) toast.error(`Não foi possível salvar seus dados: ${error.message}`);
      return false;
    }
    await refresh();
    if (showFeedback) toast.success("Dados salvos no cadastro.");
    return true;
  };

  const grandTotal = total + (items.length ? deliveryFee : 0);
  const minimumMet = total >= minimumOrder;

  const checkout = async () => {
    if (!items.length) return;
    if (!minimumMet) return toast.error(`O pedido mínimo é ${brl(minimumOrder)}.`);
    if (!activeReservation || !apartment) return toast.error("Valide sua hospedagem no Dashboard antes de realizar o pagamento.");
    if (!name.trim() || !email.trim() || !phone.trim() || !cpf.trim()) return toast.error("Preencha nome, CPF, e-mail e telefone para continuar.");
    if (!validCpf(cpf)) return toast.error("Confira o CPF informado.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Confira o e-mail informado.");

    setIsOpeningCheckout(true);
    try {
      if (user) {
        const saved = await saveProfileData(false);
        if (!saved) throw new Error("Não foi possível salvar nome, CPF e telefone no cadastro.");
      }

      const order = await createOrder.mutateAsync({
        category: "servico",
        total: grandTotal,
        customerName: name.trim(),
        customerCpf: onlyDigits(cpf),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        apartmentId: activeReservation.apartment_id,
        reservationId: activeReservation.id,
        details: JSON.stringify({
          source: "guest_cart",
          item_count: itemCount,
          apartment_code: apartment.code || "",
          check_in: activeReservation.check_in,
          check_out: activeReservation.check_out,
          subtotal: total,
          delivery_fee: deliveryFee,
        }),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          observation: item.observation?.trim() || undefined,
          service_key: item.serviceKey || (item.productId ? `product:${item.productId}` : undefined),
        })),
      });

      if (user) localStorage.setItem(`zelo_guest_pending_payment_${user.id}`, order.id);
      await openMercadoPagoCheckout(order.id);
    } catch (error) {
      setIsOpeningCheckout(false);
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
    }
  };

  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Meu carrinho" subtitle="Revise todos os serviços, kits e itens de mercado antes de realizar um único pagamento.">
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr,320px]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Itens selecionados</CardTitle><CardDescription>Informe detalhes de cada item, como sabor ou marca desejada.</CardDescription></CardHeader><CardContent>{items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p> : <div className="divide-y">{items.map((item) => <div key={`${item.id}-${item.authorizationCode || ""}`} className="space-y-3 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{brl(item.unitPrice)} por unidade{item.authorizationCode ? " · autorização registrada" : ""}</p></div><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button><span className="w-6 text-center text-sm font-semibold">{item.quantity}</span><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button></div><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button><strong className="w-20 text-right text-sm">{brl(item.unitPrice * item.quantity)}</strong></div></div><div className="space-y-1.5"><Label className="flex items-center gap-1.5 text-xs"><MessageSquareText className="h-3.5 w-3.5 text-primary" /> Observação do item (opcional)</Label><Input value={item.observation || ""} onChange={(e) => setObservation(item.id, e.target.value)} placeholder="Ex.: Lacta branco ou Bis branco" className="mt-1" /></div></div>)}</div>}</CardContent></Card>

        <Card className={activeReservation ? "border-primary/20" : "border-amber-500/30"}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" /> Hospedagem</CardTitle><CardDescription>Os dados da reserva são validados no Dashboard e usados automaticamente aqui.</CardDescription></CardHeader>
          <CardContent>
            {reservationLoading ? <p className="text-sm text-muted-foreground">Carregando hospedagem…</p> : activeReservation && apartment ? <div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Imóvel</p><p className="font-semibold">{apartment.code || apartment.name}</p></div><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Check-in</p><p className="font-semibold">{formatDate(activeReservation.check_in)}</p></div><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Check-out</p><p className="font-semibold">{formatDate(activeReservation.check_out)}</p></div></div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Hospedagem ainda não validada</p><p className="text-sm text-muted-foreground">Informe código do imóvel, check-in e check-out no Dashboard antes de pagar.</p></div><Button asChild><Link to="/hospede/dashboard">Validar hospedagem</Link></Button></div>}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Dados para identificação e cobrança</CardTitle><CardDescription>Esses dados ficam salvos no seu cadastro — você não vai precisar digitar de novo no próximo pedido.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Nome completo *</Label><Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => void saveProfileData(false)} placeholder="Nome do hóspede" className="mt-1" /></div><div><Label>CPF *</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} onBlur={() => { if (validCpf(cpf)) void saveProfileData(false); }} inputMode="numeric" placeholder="000.000.000-00" className="mt-1" /></div><div><Label>E-mail *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" className="mt-1" /></div><div className="sm:col-span-2"><Label>Telefone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => void saveProfileData(false)} inputMode="tel" placeholder="(00) 00000-0000" className="mt-1" /></div></CardContent></Card>
      </div>

      <Card className="h-fit"><CardHeader><CardTitle>Resumo</CardTitle><CardDescription>{itemCount} {itemCount === 1 ? "item" : "itens"}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between text-sm"><span>Subtotal</span><strong>{brl(total)}</strong></div>{items.length > 0 && <div className="flex items-center justify-between text-sm"><span>Taxa de entrega</span><strong>{deliveryFee ? brl(deliveryFee) : "Grátis"}</strong></div>}<div className="flex items-center justify-between border-y py-4"><span>Total</span><strong className="font-serif text-2xl">{brl(grandTotal)}</strong></div>{minimumOrder > 0 && <p className={`text-xs ${minimumMet ? "text-muted-foreground" : "text-destructive"}`}>{minimumMet ? `Pedido mínimo: ${brl(minimumOrder)}.` : `Adicione ${brl(minimumOrder - total)} para atingir o pedido mínimo de ${brl(minimumOrder)}.`}</p>}{!activeReservation && <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-800">Valide sua hospedagem no Dashboard para liberar o pagamento.</p>}<p className="text-xs text-muted-foreground">Ao tocar em pagar, aguarde alguns segundos enquanto o Mercado Pago prepara o checkout. O carrinho só é limpo após a confirmação do pagamento.</p><Button className="w-full gap-2" disabled={!items.length || !minimumMet || !activeReservation || createOrder.isPending || isOpeningCheckout} onClick={() => void checkout()}><CreditCard className="h-4 w-4" /> {isOpeningCheckout ? "Abrindo Mercado Pago…" : createOrder.isPending ? "Preparando pedido…" : "Ir para pagamento"}</Button></CardContent></Card>
    </div>
  </DashboardShell>;
}
