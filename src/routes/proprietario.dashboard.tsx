import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Clock, Wrench } from "lucide-react";
import { useOrdersStore } from "@/hooks/use-orders-store";

export const Route = createFileRoute("/proprietario/dashboard")({
  component: ProprietarioDashboard,
});

export function ProprietarioDashboard() {
  const { orders } = useOrdersStore();

  const navigationItems = ownerNav;
  const imovelCodigo = "D-204";

  // Filtra as demandas vinculadas à unidade deste proprietário
  const demandasUnidade = orders.filter(
    (o) => o.imovel?.toUpperCase() === imovelCodigo.toUpperCase(),
  );

  return (
    <DashboardShell
      nav={navigationItems}
      role="Proprietário"
      logoutTo="/proprietario/login"
      title={`Painel do Proprietário (${imovelCodigo})`}
      subtitle="Acompanhamento em tempo real da sua unidade, solicitações de hóspedes e extrato de manutenção."
    >
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Unidade Vinculada</span>
              <Home className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{imovelCodigo}</div>
              <p className="text-xs text-muted-foreground mt-1">Status: Ocupado / Em Hospedagem</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Demandas Registradas
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-amber-600">
                {demandasUnidade.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sincronizadas via Supabase</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Governança & Vistoria
              </span>
              <Wrench className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-emerald-600">Em Dia</div>
              <p className="text-xs text-muted-foreground mt-1">Padrão hoteleiro mantido</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Solicitações do seu Imóvel</CardTitle>
            <CardDescription className="text-xs">
              Serviços, kits e manutenções solicitados para a sua acomodação em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demandasUnidade.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Nenhuma solicitação recente para a sua unidade.
              </p>
            ) : (
              <div className="divide-y">
                {demandasUnidade.map((d) => (
                  <div
                    key={d.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{d.itens}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {d.categoria}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Solicitado por: <strong>{d.solicitante}</strong> • {d.valor} •{" "}
                        {d.data || "Hoje"}
                      </p>
                    </div>
                    <Badge
                      variant={d.status === "Entregue" ? "default" : "secondary"}
                      className="text-[10px] w-fit"
                    >
                      {d.status}
                    </Badge>
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
