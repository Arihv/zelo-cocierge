import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/financeiro")({ component: AdminFinanceiro });

type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | null;
type FinancialRange = "week" | "month";
type FinancialOrder = {
  id: string;
  total: number | string;
  created_at: string;
  category: string;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const paymentInfo: Record<NonNullable<PaymentStatus>, { label: string; className: string }> = {
  approved: { label: "Pago", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  pending: { label: "Aguardando pagamento", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  rejected: { label: "Recusado", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

const categoryLabel = (category: string) =>
  ({ kit: "Kit", mercado: "Mercado", limpeza: "Limpeza", organizacao: "Organização", servico: "Serviço" })[category] ?? "Pedido";

function periodStart(range: FinancialRange) {
  const start = new Date();
  if (range === "week") start.setDate(start.getDate() - 6);
  else start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function AdminFinanceiro() {
  const [orders, setOrders] = useState<FinancialOrder[]>([]);
  const [range, setRange] = useState<FinancialRange>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("orders")
      .select("*")
      .neq("category", "manutencao")
      .order("created_at", { ascending: false });
    if (queryError) {
      setError("Não foi possível carregar os dados financeiros.");
    } else {
      setOrders((data ?? []) as FinancialOrder[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // A versão anterior podia guardar credenciais no navegador. Elas não devem ser reutilizadas.
    localStorage.removeItem("estadia_gateway_config");
    void loadOrders();
    const channel = supabase
      .channel("finance-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void loadOrders())
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const start = periodStart(range);
    return orders.filter((order) => order.category !== "manutencao" && new Date(order.created_at) >= start);
  }, [orders, range]);

  const summary = useMemo(() => {
    const approved = visibleOrders.filter((order) => order.payment_status === "approved");
    const pending = visibleOrders.filter((order) => order.payment_status === "pending");
    return {
      approvedTotal: approved.reduce((total, order) => total + Number(order.total || 0), 0),
      approvedCount: approved.length,
      pendingCount: pending.length,
    };
  }, [visibleOrders]);

  return (
    <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Financeiro & Contas" subtitle="Acompanhe somente valores confirmados pelo Mercado Pago.">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recebido e aprovado</CardTitle>
              <WalletCards className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{currency.format(summary.approvedTotal)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{summary.approvedCount} pagamento{summary.approvedCount === 1 ? "" : "s"} confirmado{summary.approvedCount === 1 ? "" : "s"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aguardando pagamento</CardTitle>
              <Clock3 className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">Pedidos ainda não confirmados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Integração de pagamento</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Mercado Pago</div>
              <p className="mt-1 text-xs text-muted-foreground">Credenciais protegidas no servidor do Supabase.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Extrato de pagamentos</CardTitle>
              <CardDescription>Somente compras aprovadas pelo Mercado Pago entram como receita.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex rounded-md border p-0.5">
                <Button size="sm" variant={range === "week" ? "default" : "ghost"} onClick={() => setRange("week")}>Semanal</Button>
                <Button size="sm" variant={range === "month" ? "default" : "ghost"} onClick={() => setRange("month")}>Mensal</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadOrders()} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
            {!error && loading ? <div className="py-8 text-center text-sm text-muted-foreground">Carregando pagamentos…</div> : null}
            {!error && !loading && visibleOrders.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado neste período.</div> : null}
            {!error && !loading && visibleOrders.length > 0 ? <div className="divide-y">
              {visibleOrders.map((order) => {
                const info = paymentInfo[order.payment_status ?? "pending"];
                return <div key={order.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8).toUpperCase()}</span><span className="font-medium">{categoryLabel(order.category)}</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}{order.payment_provider ? ` • ${order.payment_provider}` : ""}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${info.className}`}>{info.label}</span><span className="min-w-24 text-right font-semibold">{currency.format(Number(order.total || 0))}</span></div>
                </div>;
              })}
            </div> : null}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Chamados de manutenção são operacionais: não geram cobrança e não entram no extrato ou nos indicadores financeiros.
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Dados bancários, chaves PIX e tokens não são armazenados nesta tela. O Access Token do Mercado Pago deve existir apenas em <strong>Edge Functions → Secrets</strong> no Supabase.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
