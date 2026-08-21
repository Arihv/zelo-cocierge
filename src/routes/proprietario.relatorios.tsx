import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { useApartments, useOwnerOrders } from "@/lib/api";
import { brl, orderCategoryLabels } from "@/lib/orders";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/proprietario/relatorios")({
  component: ProprietarioReports,
});

const paidStatuses = new Set(["confirmado", "em_preparacao", "em_entrega", "concluido"]);

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

function ProprietarioReports() {
  const { data: apartments = [], isLoading: apartmentsLoading } = useApartments(true);
  const { data: orders = [], isLoading: ordersLoading } = useOwnerOrders();

  const report = useMemo(() => {
    const apartmentIds = new Set(apartments.map((apartment) => apartment.id));
    const ownerOrders = orders.filter((order) => order.apartment_id && apartmentIds.has(order.apartment_id));
    const validOrders = ownerOrders.filter((order) => order.status !== "cancelado");
    const confirmedOrders = validOrders.filter((order) => paidStatuses.has(order.status));

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return { key: monthKey(date), m: monthLabel(date), value: 0 };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));
    confirmedOrders.forEach((order) => {
      const month = byMonth.get(monthKey(new Date(order.created_at)));
      if (month) month.value += Number(order.total || 0);
    });

    const byCategory = new Map<string, number>();
    validOrders.forEach((order) => {
      byCategory.set(order.category, (byCategory.get(order.category) || 0) + 1);
    });
    const categories = Array.from(byCategory.entries())
      .map(([category, value]) => ({ name: orderCategoryLabels[category as keyof typeof orderCategoryLabels] || category, value }))
      .sort((first, second) => second.value - first.value);

    return {
      months,
      categories,
      totalRevenue: confirmedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      totalOrders: validOrders.length,
    };
  }, [apartments, orders]);

  const loading = apartmentsLoading || ordersLoading;

  return (
    <DashboardShell title="Relatórios" subtitle="Resumo atualizado dos pedidos vinculados aos seus imóveis." role="Proprietário" nav={ownerNav} logoutTo="/proprietario/login">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Faturamento confirmado</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{loading ? "…" : brl(report.totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pedidos confirmados, em preparo, entrega ou concluídos.</p>
          </Card>
          <Card className="border-border/60 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Solicitações registradas</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{loading ? "…" : report.totalOrders}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cancelamentos não entram nos relatórios.</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 p-5 shadow-soft">
            <h3 className="font-serif text-lg font-semibold">Faturamento mensal</h3>
            <p className="mt-1 text-xs text-muted-foreground">Últimos seis meses, considerando pedidos confirmados.</p>
            <div className="mt-4 h-64">
              {loading ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Carregando relatório...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.months} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(value) => brl(value).replace("R$", "").trim()} width={58} />
                    <Tooltip formatter={(value: number) => brl(value)} labelFormatter={(label) => `Mês: ${label}`} />
                    <Line type="monotone" dataKey="value" name="Faturamento" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
          <Card className="border-border/60 p-5 shadow-soft">
            <h3 className="font-serif text-lg font-semibold">Pedidos por categoria</h3>
            <p className="mt-1 text-xs text-muted-foreground">Pedidos e chamados não cancelados dos seus imóveis.</p>
            <div className="mt-4 h-64">
              {loading ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Carregando relatório...</p> : report.categories.length === 0 ? <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">Ainda não há solicitações registradas para os seus imóveis.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categories} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip formatter={(value: number) => [value, "Pedidos"]} />
                    <Bar dataKey="value" name="Pedidos" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
