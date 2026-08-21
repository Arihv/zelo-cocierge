import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllOrders, useUpdateOrderStatus, type OrderRow } from "@/lib/api";
import { formatDateTime, orderStatusLabels, statusTone, type OrderStatus } from "@/lib/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chamados")({ component: AdminChamados });

type MaintenanceDetails = {
  solicitante?: string;
  perfil?: string;
  imovel?: string;
  categoria?: string;
  descricao?: string;
  prioridade?: string;
  data_desejada?: string | null;
};

function detailsOf(order: OrderRow): MaintenanceDetails {
  try {
    return JSON.parse(order.details || "{}") as MaintenanceDetails;
  } catch {
    return { descricao: order.details || undefined };
  }
}

function AdminChamados() {
  const { data: orders = [], isLoading } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const calls = orders.filter((order) => order.category === "manutencao");

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Status do chamado atualizado.");
    } catch (error) {
      toast.error("Não foi possível atualizar o chamado.", { description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Central de Chamados" subtitle="Chamados de manutenção enviados por proprietários, atualizados em tempo real.">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground"><Wrench className="h-5 w-5 text-primary" />
            Todo chamado novo também aparece no sininho da administração. Atualize o status aqui para manter o solicitante informado.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chamados recebidos ({calls.length})</CardTitle>
            <CardDescription>Organize a manutenção por prioridade, imóvel e data desejada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando chamados...</p> : null}
            {!isLoading && calls.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum chamado de manutenção foi aberto até o momento.</p> : null}
            {calls.map((call) => {
              const details = detailsOf(call);
              return <article key={call.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{call.order_number}</Badge><Badge variant={statusTone(call.status)}>{orderStatusLabels[call.status]}</Badge>{details.prioridade ? <Badge variant="secondary">Prioridade {details.prioridade}</Badge> : null}</div>
                    <h2 className="font-semibold">{details.categoria || "Manutenção"}</h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">{details.descricao || "Sem descrição informada."}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{details.imovel || call.apartments?.code || call.apartments?.name || "Imóvel não informado"}</span>
                      <span>{details.solicitante || "Solicitante não informado"} · {details.perfil || "Proprietário"}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Aberto em {formatDateTime(call.created_at)}</span>
                      {details.data_desejada ? <span>Data desejada: {details.data_desejada.split("-").reverse().join("/")}</span> : null}
                    </div>
                  </div>
                  <select aria-label="Status do chamado" value={call.status} disabled={updateStatus.isPending} onChange={(event) => void changeStatus(call.id, event.target.value as OrderStatus)} className="h-10 min-w-44 rounded-md border bg-background px-3 text-sm">
                    {Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </article>;
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
