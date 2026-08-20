import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { useOrdersStore } from "@/hooks/use-orders-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Package, CheckCircle2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/hospede/historico")({
  component: HospedeHistorico,
});

export function HospedeHistorico() {
  const { orders: pedidos, loading } = useOrdersStore();

  const totalGasto = pedidos.reduce((acc, p) => {
    const val = parseFloat(String(p.valor || "0").replace(/[^\d,-]/g, "").replace(",", "."));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/"
      title="Histórico & Cobranças"
      subtitle="Acompanhe todas as suas compras de mercado, kits e serviços contratados."
    >
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Resumo de Gastos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total em Pedidos</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-emerald-600">
                R$ {totalGasto.toFixed(2).replace(".", ",")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Soma de conveniências e facilidades</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Pedidos Solicitados</span>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{pedidos.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Itens entregues ou em preparação</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Extrato de Consumo da Estadia
            </CardTitle>
            <CardDescription>Atualizado em tempo real com a equipe da Zelo.</CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Carregando pedidos...</div>
            ) : pedidos.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">Você ainda não realizou nenhum pedido nesta hospedagem.</p>
              </div>
            ) : (
              <div className="divide-y">
                {pedidos.map((p, idx) => (
                  <div key={p.id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">{p.id}</Badge>
                        <span className="text-xs font-bold text-primary">{p.categoria || "Pedido"}</span>
                        <span className="text-xs text-muted-foreground">• {p.data}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{p.itens}</p>
                      <p className="text-xs text-muted-foreground">Entregar para: <b>{p.solicitante}</b> (Unidade {p.imovel})</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-2 sm:pt-0">
                      <span className="text-base font-bold font-serif text-foreground">{p.valor}</span>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {p.status || "Recebido"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
