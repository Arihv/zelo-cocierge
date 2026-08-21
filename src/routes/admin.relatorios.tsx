import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { useAllOrders } from "@/lib/api";
import { brl, orderCategoryLabels } from "@/lib/orders";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/admin/relatorios")({ component: AdminReports });

const paidStatuses = new Set(["confirmado", "em_preparacao", "em_entrega", "concluido"]);

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

/**
 * Mantém os gráficos legíveis à medida que o volume cresce. A escala começa
 * em dezenas e sobe com passos "naturais" (10, 20, 50, 100, 200...).
 */
function chartScale(values: number[]) {
  const highest = Math.max(0, ...values);
  const targetTicks = 5;
  const rawStep = Math.max(10, highest / targetTicks);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(10, niceNormalized * magnitude);
  const max = Math.max(10, Math.ceil(highest / step) * step);

  return {
    max,
    ticks: Array.from({ length: max / step + 1 }, (_, index) => index * step),
  };
}

function AdminReports() {
  const { data: orders = [], isLoading } = useAllOrders();

  const report = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== "cancelado");
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
    validOrders.forEach((order) => byCategory.set(order.category, (byCategory.get(order.category) || 0) + 1));

    return {
      months,
      categories: Array.from(byCategory.entries())
        .map(([category, value]) => ({ name: orderCategoryLabels[category as keyof typeof orderCategoryLabels] || category, value }))
        .sort((first, second) => second.value - first.value),
      totalRevenue: confirmedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      totalOrders: validOrders.length,
    };
  }, [orders]);

  const revenueScale = useMemo(() => chartScale(report.months.map((month) => month.value)), [report.months]);
  const categoryScale = useMemo(() => chartScale(report.categories.map((category) => category.value)), [report.categories]);

  return (
    <DashboardShell title="Relatórios gerais" subtitle="Visão consolidada e atualizada de todos os imóveis." role="Administrador" nav={adminNav} logoutTo="/admin/login">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Faturamento confirmado</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{isLoading ? "…" : brl(report.totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Todos os imóveis; pedidos confirmados, em preparo, entrega ou concluídos.</p>
          </Card>
          <Card className="border-border/60 p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Solicitações registradas</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{isLoading ? "…" : report.totalOrders}</p>
            <p className="mt-1 text-xs text-muted-foreground">Inclui pedidos e chamados; cancelamentos ficam de fora.</p>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 p-5 shadow-soft">
            <h3 className="font-serif text-lg font-semibold">Faturamento mensal</h3>
            <p className="mt-1 text-xs text-muted-foreground">Últimos seis meses, com valores confirmados.</p>
            <div className="mt-4 h-64">
              {isLoading ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Carregando relatório...</p> : <ResponsiveContainer width="100%" height="100%"><LineChart data={report.months} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} /><YAxis domain={[0, revenueScale.max]} ticks={revenueScale.ticks} stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(value) => brl(value).replace("R$", "").trim()} width={58} /><Tooltip formatter={(value: number) => brl(value)} labelFormatter={(label) => `Mês: ${label}`} /><Line type="monotone" dataKey="value" name="Faturamento" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>}
            </div>
          </Card>
          <Card className="border-border/60 p-5 shadow-soft">
            <h3 className="font-serif text-lg font-semibold">Pedidos por categoria</h3>
            <p className="mt-1 text-xs text-muted-foreground">Distribuição de solicitações de todos os imóveis.</p>
            <div className="mt-4 h-64">
              {isLoading ? <p className="grid h-full place-items-center text-sm text-muted-foreground">Carregando relatório...</p> : report.categories.length === 0 ? <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">Ainda não há solicitações registradas.</p> : <ResponsiveContainer width="100%" height="100%"><BarChart data={report.categories} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} /><YAxis domain={[0, categoryScale.max]} ticks={categoryScale.ticks} allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} /><Tooltip formatter={(value: number) => [value, "Pedidos"]} /><Bar dataKey="value" name="Pedidos" fill="var(--color-gold)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
