import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, CalendarRange, ShoppingBag, DollarSign, Clock } from "lucide-react";
import { useAllOrders, useApartments, useReservations } from "@/lib/api";
import { orderItemsSummary, orderStatusLabels } from "@/lib/orders";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

export function AdminDashboard() {
  const { data: orders = [] } = useAllOrders();
  const { data: apartments = [] } = useApartments();
  const { data: reservations = [] } = useReservations();
  const guestsCount = new Set(reservations.map((reservation) => reservation.guest_id).filter(Boolean)).size;
  const pendingOrders = orders.filter((order) => !["concluido", "cancelado"].includes(order.status)).length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const countByType = (type: string) => apartments.filter((apartment) => apartment.code?.startsWith(type)).length;

  return (
    <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Painel de Operações" subtitle="Dados sincronizados da plataforma.">
      <div className="mx-auto max-w-6xl space-y-6 text-left">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Users} label="Hóspedes ativos" value={guestsCount} description="Com reserva vinculada" />
          <Metric icon={Home} label="Imóveis cadastrados" value={apartments.length} description={`${countByType("S")} S, ${countByType("D")} D, ${countByType("T")} T`} />
          <Metric icon={Clock} label="Pedidos pendentes" value={pendingOrders} description="Atualizados em tempo real" />
          <Metric icon={DollarSign} label="Faturamento" value={`R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} description="Pedidos registrados" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarRange className="h-4 w-4 text-primary" /> Próximos check-ins</CardTitle><CardDescription>Reservas registradas no banco</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {reservations.slice(0, 4).map((reservation) => <div key={reservation.id} className="border-b pb-3 text-sm last:border-0"><p className="font-semibold">{reservation.guest_name || "Hóspede"}</p><p className="text-xs text-muted-foreground">{reservation.apartments?.code || "—"} · Check-in: {reservation.check_in}</p></div>)}
              {!reservations.length && <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma reserva cadastrada.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="h-4 w-4 text-primary" /> Últimos pedidos</CardTitle><CardDescription>Solicitações de hóspedes e operação</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {orders.slice(0, 4).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 border-b pb-3 text-sm last:border-0"><div className="min-w-0"><p className="truncate font-semibold">{order.customer_name || order.owner_profile?.full_name || "Solicitante não informado"} · {order.apartments?.code || "—"}</p><p className="truncate text-xs text-muted-foreground">{orderItemsSummary(order)}</p></div><span className="shrink-0 text-xs font-medium">{orderStatusLabels[order.status]}</span></div>)}
              {!orders.length && <p className="py-6 text-center text-xs text-muted-foreground">Nenhum pedido registrado.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon: Icon, label, value, description }: { icon: typeof Users; label: string; value: string | number; description: string }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm font-medium text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold font-serif">{value}</div><p className="mt-1 text-xs text-muted-foreground">{description}</p></CardContent></Card>;
}
