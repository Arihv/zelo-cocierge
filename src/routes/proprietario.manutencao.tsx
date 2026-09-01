import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useApartments, useCreateOrder, useOwnerOrders } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, orderStatusLabels, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/proprietario/manutencao")({
  component: MaintPage,
});

const categories = ["Elétrica", "Hidráulica", "Pintura", "Marcenaria"];
const priorities = [
  { id: "baixa", label: "Baixa", color: "bg-muted text-muted-foreground" },
  { id: "media", label: "Média", color: "bg-primary/15 text-primary" },
  { id: "alta", label: "Alta", color: "bg-warning/25 text-warning-foreground" },
  { id: "urgente", label: "Urgente", color: "bg-destructive/15 text-destructive" },
];

function MaintPage() {
  const { profile, user } = useAuth();
  const { data: apartments = [], isLoading: loadingApartments } = useApartments(true);
  const createOrder = useCreateOrder();
  const { data: ownerOrders = [] } = useOwnerOrders();
  const maintenanceOrders = ownerOrders.filter((order) => order.category === "manutencao");
  const [priority, setPriority] = useState("media");
  const [category, setCategory] = useState(categories[0]);
  const [apartmentId, setApartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    if (!apartmentId && apartments[0]) setApartmentId(apartments[0].id);
  }, [apartmentId, apartments]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const apartment = apartments.find((item) => item.id === apartmentId);
    if (!apartment) {
      toast.error("Selecione um apartamento para abrir o chamado.");
      return;
    }
    try {
      await createOrder.mutateAsync({
        category: "manutencao",
        total: 0,
        apartmentId,
        scheduledFor: scheduledFor || null,
        details: JSON.stringify({
          solicitante: profile?.full_name || user?.email || "Proprietário",
          perfil: "Proprietário",
          imovel: apartment.code || apartment.name,
          categoria: category,
          descricao: description,
          prioridade: priorities.find((item) => item.id === priority)?.label || priority,
          data_desejada: scheduledFor || null,
        }),
      });
      setDescription("");
      setScheduledFor("");
      toast.success("Chamado enviado à administração.", { description: "A equipe Zelo recebeu uma notificação e acompanhará o atendimento." });
    } catch (error) {
      toast.error("Não foi possível abrir o chamado.", { description: error instanceof Error ? error.message : "Tente novamente em alguns instantes." });
    }
  };

  return (
    <DashboardShell title="Manutenção" subtitle="Abra um chamado por categoria e prioridade." role="Proprietário" nav={ownerNav} logoutTo="/">
<div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <Card className="border-border/60 p-6 shadow-elegant">
        <h3 className="font-serif text-xl font-semibold">Novo chamado</h3>
        {loadingApartments ? <p className="mt-5 text-sm text-muted-foreground">Carregando seus imóveis...</p> : apartments.length === 0 ? <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum imóvel está vinculado à sua conta. Peça à administração para vincular seu imóvel antes de abrir um chamado.</p> : <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Apartamento</Label>
              <Select value={apartmentId} onValueChange={setApartmentId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{apartments.map((item) => <SelectItem key={item.id} value={item.id}>{item.code || item.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {priorities.map((p) => (
                <button type="button" key={p.id} onClick={() => setPriority(p.id)} className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  priority === p.id ? p.color + " border-transparent" : "bg-card text-muted-foreground",
                )}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva o problema..." required /></div>
          <div className="space-y-1.5"><Label>Data desejada</Label><Input value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} type="date" /></div>
          <Button type="submit" disabled={createOrder.isPending} className="h-11 w-full">{createOrder.isPending ? "Enviando chamado..." : "Abrir chamado"}</Button>
        </form>}
      </Card>
      <Card className="h-fit border-border/60 p-6 shadow-elegant"><h3 className="font-serif text-xl font-semibold">Chamados dos seus imóveis</h3><p className="mt-1 text-sm text-muted-foreground">Mudanças feitas pela operação aparecem aqui automaticamente.</p><div className="mt-4 divide-y">{maintenanceOrders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum chamado registrado.</p> : maintenanceOrders.map((order) => { let details: any = {}; try { details = JSON.parse(order.details || "{}"); } catch {} return <div key={order.id} className="space-y-1 py-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{details.categoria || "Manutenção"} · {order.order_number}</p><Badge variant={statusTone(order.status)}>{orderStatusLabels[order.status]}</Badge></div><p className="text-sm text-muted-foreground">{details.descricao || "Chamado de manutenção"}</p><p className="text-xs text-muted-foreground">{order.apartments?.code || details.imovel || "Imóvel"} · atualizado {formatDateTime(order.updated_at || order.created_at)}</p></div>; })}</div></Card>
      </div>
    </DashboardShell>
  );
}
