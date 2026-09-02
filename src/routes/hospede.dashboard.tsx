import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, History, KeyRound, MapPin, Package, ShoppingBag, ShoppingCart, Sparkles, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMyOrders, useSelfActivateReservation } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { guestNav } from "@/lib/nav";
import { formatDateTime, orderItemsSummary, orderStatusLabels, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/hospede/dashboard")({ component: HospedeDashboard });

export function HospedeDashboard() {
  const { user, profile } = useAuth();
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders();
  const activateReservation = useSelfActivateReservation();
  const [reservation, setReservation] = useState<any>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [code, setCode] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const userName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Hóspede";

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadReservation = async () => {
      setLoadingReservation(true);
      const { data } = await supabase
        .from("reservations")
        .select("id, reservation_code, check_in, check_out, status, apartments(id, name, code, address, city, state)")
        .eq("guest_id", user.id)
        .in("status", ["confirmada", "ativa"])
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active) {
        setReservation(data);
        setLoadingReservation(false);
      }
    };
    void loadReservation();
    const channel = supabase
      .channel(`guest-reservation-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `guest_id=eq.${user.id}` }, () => void loadReservation())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const submitReservation = async () => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return toast.error("Informe o código do imóvel.");
    if (!checkIn || !checkOut) return toast.error("Informe check-in e check-out.");
    if (checkOut <= checkIn) return toast.error("O check-out deve ser posterior ao check-in.");

    try {
      await activateReservation.mutateAsync({ code: normalizedCode, checkIn, checkOut });
      toast.success("Hospedagem validada com sucesso!", { description: "Os dados já serão usados automaticamente nos seus pedidos e serviços." });
      setCode("");
      setCheckIn("");
      setCheckOut("");
      if (user) {
        const { data } = await supabase
          .from("reservations")
          .select("id, reservation_code, check_in, check_out, status, apartments(id, name, code, address, city, state)")
          .eq("guest_id", user.id)
          .in("status", ["confirmada", "ativa"])
          .order("check_in", { ascending: false })
          .limit(1)
          .maybeSingle();
        setReservation(data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível validar sua hospedagem.");
    }
  };

  const kitsCount = orders.filter((order) => order.category === "kit").length;
  const mercadoCount = orders.filter((order) => order.category === "mercado").length;
  const openCount = orders.filter((order) => !["concluido", "cancelado"].includes(order.status)).length;
  const apartment = Array.isArray(reservation?.apartments) ? reservation.apartments[0] : reservation?.apartments;

  const shortcuts = [
    { label: "Mercado", description: `${mercadoCount} pedidos`, to: "/hospede/mercado", icon: <ShoppingBag className="h-5 w-5" /> },
    { label: "Kits", description: `${kitsCount} solicitados`, to: "/hospede/kits", icon: <Package className="h-5 w-5" /> },
    { label: "Serviços", description: "Comodidades da estadia", to: "/hospede/servicos", icon: <Sparkles className="h-5 w-5" /> },
    { label: "Manutenção", description: "Abrir e acompanhar chamados", to: "/hospede/manutencao", icon: <Wrench className="h-5 w-5" /> },
    { label: "Histórico", description: `${openCount} em andamento`, to: "/hospede/historico", icon: <History className="h-5 w-5" /> },
    { label: "Carrinho", description: "Revisar e pagar", to: "/hospede/carrinho", icon: <ShoppingCart className="h-5 w-5" /> },
  ] as const;

  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title={`Olá, ${userName.split(" ")[0]}`} subtitle="Bem-vindo(a) de volta à sua estadia.">
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/50 bg-primary/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary"><KeyRound className="h-4 w-4" /> Sua hospedagem</div>
        <CardContent className="p-6">
          {loadingReservation ? <p className="text-sm text-muted-foreground">Carregando sua reserva…</p> : reservation ? (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-serif text-xl font-bold">{apartment?.name || "Imóvel vinculado"}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> {[apartment?.code, apartment?.address, apartment?.city, apartment?.state].filter(Boolean).join(" · ") || "Dados da hospedagem vinculada"}</p>
                </div>
                <Badge variant="secondary">Hospedagem validada</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2"><DateCard label="Check-in" value={reservation.check_in} /><DateCard label="Check-out" value={reservation.check_out} /></div>
              <p className="text-xs text-muted-foreground">Esses dados serão preenchidos automaticamente no carrinho, serviços e solicitações.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold">Valide sua própria hospedagem</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Informe o código do imóvel e as datas da sua estadia. Você não precisa esperar a administração cadastrar sua reserva manualmente.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label htmlFor="reservation-apartment-code">Código do imóvel *</Label><Input id="reservation-apartment-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: D-CH3579" className="mt-1 font-mono uppercase" /></div>
                <div><Label htmlFor="reservation-check-in">Check-in *</Label><Input id="reservation-check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="reservation-check-out">Check-out *</Label><Input id="reservation-check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || undefined} className="mt-1" /></div>
              </div>
              <Button onClick={() => void submitReservation()} disabled={activateReservation.isPending} className="w-full sm:w-auto">{activateReservation.isPending ? "Validando hospedagem…" : "Validar minha hospedagem"}</Button>
              <p className="text-xs text-muted-foreground">Ao validar, a reserva aparece automaticamente para a administração e os dados passam a ser usados nos pedidos.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shortcuts.map((item) => <Link key={item.to} to={item.to} className="group"><Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">{item.icon}</div><div><p className="font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.description}</p></div></CardContent></Card></Link>)}</div>

      <Card><CardHeader><CardTitle className="text-lg">Últimos pedidos</CardTitle><CardDescription>Apenas os pedidos vinculados à sua conta são exibidos aqui.</CardDescription></CardHeader><CardContent>{ordersLoading ? <p className="text-sm text-muted-foreground">Carregando pedidos…</p> : orders.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Você ainda não realizou pedidos nesta hospedagem.</p> : <div className="divide-y">{orders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{orderItemsSummary(order)}</p><p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold">{Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><Badge variant={statusTone(order.status)} className="text-[10px]">{orderStatusLabels[order.status]}</Badge></div></div>)}</div>}</CardContent></Card>
    </div>
  </DashboardShell>;
}

function DateCard({ label, value }: { label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><CalendarDays className="h-5 w-5" /></div><div><span className="block text-[11px] font-semibold uppercase text-muted-foreground">{label}</span><span className="text-sm font-bold">{value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</span></div></div>; }
