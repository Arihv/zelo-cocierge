import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/proprietario/pedidos")({
  component: ProprietarioPedidosPage,
});

interface OrderItem {
  id: string;
  solicitante?: string;
  perfil?: string;
  imovel?: string;
  categoria?: string;
  itens?: string;
  valor?: string;
  data?: string;
  status?: string;
}

const STORAGE_KEY = "zelo_historico_pedidos";

export function ProprietarioPedidosPage() {
  const [pedidos, setPedidos] = useState<OrderItem[]>([]);

  useEffect(() => {
    const carregar = () => {
      try {
        const salvos = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("estadia_historico_pedidos");
        if (salvos) {
          const parsed = JSON.parse(salvos);
          if (Array.isArray(parsed)) {
            setPedidos(parsed);
            return;
          }
        }
        setPedidos([]);
      } catch {
        setPedidos([]);
      }
    };

    carregar();

    window.addEventListener("storage", carregar);
    window.addEventListener("zelo_orders_updated", carregar);

    return () => {
      window.removeEventListener("storage", carregar);
      window.removeEventListener("zelo_orders_updated", carregar);
    };
  }, []);

  const getStatusBadge = (status?: string) => {
    const s = String(status || "Recebido").toLowerCase();
    if (s.includes("entregue") || s.includes("concluído")) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1">
          <CheckCircle2 className="h-3 w-3" /> {status || "Concluído"}
        </Badge>
      );
    }
    if (s.includes("preparação") || s.includes("entrega") || s.includes("análise")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1">
          <Clock className="h-3 w-3" /> {status || "Em Preparação"}
        </Badge>
      );
    }
    if (s.includes("cancelado")) {
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
          <AlertCircle className="h-3 w-3" /> {status || "Cancelado"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" /> {status || "Recebido"}
      </Badge>
    );
  };

  return (
    <DashboardShell
      nav={ownerNav}
      role="Proprietário"
      logoutTo="/"
      title="Histórico de Pedidos"
      subtitle="Acompanhe o status de todas as solicitações e serviços contratados."
    >
      <Card className="border-border/80 shadow-sm text-left">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Pedidos Recentes
              </CardTitle>
              <CardDescription>Lista completa de serviços e comodidades solicitadas.</CardDescription>
            </div>
            {pedidos.length > 0 && (
              <Badge variant="outline">{pedidos.length} pedidos</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 stroke-[1.5] mb-3 text-muted-foreground/60" />
              <p className="text-base font-medium">Nenhum pedido em andamento</p>
              <p className="text-sm">Quando você solicitar serviços ou comodidades, eles aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div className="divide-y border rounded-lg">
              {pedidos.map((p, index) => (
                <div key={p.id || `ped-${index}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {p.id || "PED-000"}
                      </span>
                      {p.imovel && <Badge variant="outline">{p.imovel}</Badge>}
                      <span className="text-xs font-semibold text-muted-foreground">{p.categoria || "Serviço"}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{p.itens || "Item solicitado"}</p>
                    <p className="text-xs text-muted-foreground">{p.data || "Hoje"}</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="font-serif font-bold text-sm">{p.valor || "—"}</span>
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}