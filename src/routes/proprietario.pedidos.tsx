import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, History } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyOrders } from "@/lib/api";
import { brl, formatDateTime, orderCategoryLabels, orderStatusLabels, statusTone, type OrderCategory, type OrderStatus } from "@/lib/orders";
import { ownerNav } from "@/lib/nav";

export const Route = createFileRoute("/proprietario/pedidos")({ component: ProprietarioPedidosPage });

export function ProprietarioPedidosPage() {
  const { data: orders = [], isLoading, isError } = useMyOrders();

  return (
    <DashboardShell nav={ownerNav} role="Proprietário" logoutTo="/proprietario/login" title="Histórico de pedidos" subtitle="Acompanhe os pedidos de mercado e serviços feitos para os seus imóveis.">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Pedidos recentes</CardTitle>
              <CardDescription>Atualizado automaticamente conforme o pagamento e a entrega avançam.</CardDescription>
            </div>
            <Badge variant="outline">{orders.length} pedido{orders.length === 1 ? "" : "s"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Carregando pedidos...</div>
          ) : isError ? (
            <div className="flex items-center justify-center gap-2 py-10 text-center text-sm text-destructive"><AlertCircle className="h-4 w-4" /> Não foi possível carregar os pedidos.</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"><Clock className="mb-3 h-10 w-10 stroke-[1.5] opacity-60" /><p className="font-medium">Nenhum pedido realizado</p><p className="text-sm">Os itens solicitados no mercado aparecerão aqui.</p></div>
          ) : (
            <div className="divide-y rounded-lg border">
              {orders.map((order) => {
                const category = order.category as OrderCategory;
                const status = order.status as OrderStatus;
                const apartment = order.apartments;
                return (
                  <div key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">{order.order_number || order.id.slice(0, 8)}</span><Badge variant="outline">{orderCategoryLabels[category] ?? order.category}</Badge>{apartment && <span className="text-xs text-muted-foreground">{apartment.code} — {apartment.name}</span>}</div>
                      <p className="text-sm text-muted-foreground">Solicitado em {formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end"><strong>{brl(Number(order.total))}</strong><Badge variant={statusTone(status)} className="gap-1">{status === "concluido" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{orderStatusLabels[status] ?? order.status}</Badge></div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
