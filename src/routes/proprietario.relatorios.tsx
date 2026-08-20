import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { revenueSeries, categorySeries, brl } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/proprietario/relatorios")({
  component: () => (
    <DashboardShell title="Relatórios" subtitle="Visão geral dos últimos meses." role="Proprietário" nav={ownerNav} logoutTo="/">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 p-5 shadow-soft">
          <h3 className="font-serif text-lg font-semibold">Faturamento mensal</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => brl(v).replace(/\s/, "")} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="border-border/60 p-5 shadow-soft">
          <h3 className="font-serif text-lg font-semibold">Pedidos por categoria</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={categorySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardShell>
  ),
});
