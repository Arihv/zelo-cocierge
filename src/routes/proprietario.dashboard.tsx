import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Clock, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApartments, useOwnerOrders } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/proprietario/dashboard")({
  component: ProprietarioDashboard,
});

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

function orderDescription(details: string | null) {
  if (!details) return "Solicitação";
  try {
    const parsed = JSON.parse(details) as { itens?: string };
    return parsed.itens || "Solicitação";
  } catch {
    return details;
  }
}

function categoryLabel(category: string) {
  return ({ kit: "Kits", mercado: "Minimercado", manutencao: "Manutenção" } as Record<string, string>)[category] ?? "Serviços";
}

function statusLabel(status: string) {
  return ({ concluido: "Entregue", cancelado: "Cancelado", em_preparacao: "Em preparação", em_entrega: "Em entrega", confirmado: "Confirmado" } as Record<string, string>)[status] ?? "Recebido";
}

export function ProprietarioDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: apartments = [], isLoading: apartmentsLoading } = useApartments(true);
  const { data: orders = [], isLoading: ordersLoading } = useOwnerOrders();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`owner-dashboard-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "apartments" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["apartments", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["orders", "owner", user.id] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const apartmentIds = useMemo(() => new Set(apartments.map((apartment) => apartment.id)), [apartments]);
  const demands = useMemo(
    () => orders.filter((order) => order.apartment_id && apartmentIds.has(order.apartment_id)),
    [apartmentIds, orders],
  );
  const unitCodes = apartments.map((apartment) => apartment.code || apartment.name).filter(Boolean);
  const unitTitle = apartments.length === 1 ? unitCodes[0] : `${apartments.length} unidades`;
  const loading = apartmentsLoading || ordersLoading;

  return (
    <DashboardShell
      nav={ownerNav}
      role="Proprietário"
      logoutTo="/proprietario/login"
      title="Painel do Proprietário"
      subtitle="Acompanhamento em tempo real dos seus imóveis, solicitações de hóspedes e manutenção."
    >
      <div className="mx-auto max-w-6xl space-y-6 text-left">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Imóveis vinculados</span>
              <Home className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold">{loading ? "…" : unitTitle}</div>
              <p className="mt-1 truncate text-xs text-muted-foreground" title={unitCodes.join(" • ")}>
                {apartments.length ? unitCodes.join(" • ") : "Nenhum imóvel vinculado à sua conta"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Demandas registradas</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-amber-600">{loading ? "…" : demands.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">Solicitações dos seus imóveis</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Imóveis ativos</span>
              <Wrench className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-emerald-600">
                {loading ? "…" : apartments.filter((apartment) => apartment.is_active).length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Disponíveis na operação</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Histórico de solicitações dos seus imóveis</CardTitle>
            <CardDescription className="text-xs">Serviços, kits e manutenções vinculados aos seus imóveis.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p className="py-8 text-center text-xs text-muted-foreground">Carregando dados atualizados…</p> : null}
            {!loading && demands.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Nenhuma solicitação recente para seus imóveis.</p> : null}
            {!loading && demands.length > 0 ? (
              <div className="divide-y">
                {demands.map((demand) => (
                  <div key={demand.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{orderDescription(demand.details)}</span>
                        <Badge variant="outline" className="text-[10px]">{categoryLabel(demand.category)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {demand.apartments?.code ?? "Imóvel vinculado"} • {money(demand.total)} • {new Date(demand.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={demand.status === "concluido" ? "default" : "secondary"} className="w-fit text-[10px]">
                      {statusLabel(demand.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
