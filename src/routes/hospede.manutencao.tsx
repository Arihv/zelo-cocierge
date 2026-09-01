import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { findApartmentIdByCode, useCreateOrder, useMyOrders, useMyReservation } from "@/lib/api";
import { guestNav } from "@/lib/nav";
import { formatDateTime, orderStatusLabels, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/hospede/manutencao")({ component: GuestMaintenancePage });
const categories = ["Elétrica", "Hidráulica", "Climatização", "Eletrodoméstico", "Mobiliário", "Outro"];
const priorities = [{ id: "baixa", label: "Baixa" }, { id: "media", label: "Média" }, { id: "alta", label: "Alta" }, { id: "urgente", label: "Urgente" }];

function GuestMaintenancePage() {
  const { profile } = useAuth();
  const createOrder = useCreateOrder();
  const { data: reservation } = useMyReservation();
  const { data: orders = [] } = useMyOrders();
  const maintenanceOrders = orders.filter((order) => order.category === "manutencao");
  const [apartmentCode, setApartmentCode] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!reservation) return;
    const apartment = Array.isArray(reservation.apartments) ? reservation.apartments[0] : reservation.apartments;
    if (apartment?.code) setApartmentCode(apartment.code);
  }, [reservation]);

  const submit = async () => {
    if (!apartmentCode.trim()) { toast.error("Informe o código do imóvel da hospedagem."); return; }
    if (!description.trim()) { toast.error("Descreva o problema para a equipe."); return; }
    try {
      const apartmentId = await findApartmentIdByCode(apartmentCode);
      await createOrder.mutateAsync({ category: "manutencao", total: 0, apartmentId, reservationId: reservation?.id ?? null, details: JSON.stringify({ solicitante: profile?.full_name || "Hóspede", perfil: "Hóspede", imovel: apartmentCode.trim().toUpperCase(), categoria: category, prioridade: priority, descricao: description.trim() }) });
      setDescription(""); toast.success("Chamado enviado! A administração foi notificada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o chamado."); }
  };

  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Manutenção" subtitle="Abra e acompanhe os chamados da sua hospedagem."><div className="grid gap-6 lg:grid-cols-[1fr,1fr]"><Card className="border-border/60 shadow-soft"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Novo chamado</CardTitle><CardDescription>{reservation ? "O imóvel foi preenchido automaticamente pela sua reserva ativa." : "Informe o código do imóvel para direcionar o chamado corretamente."}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2 sm:max-w-[10rem]"><Label>Código do imóvel *</Label><Input value={apartmentCode} onChange={(e) => setApartmentCode(e.target.value.toUpperCase())} placeholder="Ex.: S101" className="font-mono uppercase" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Prioridade</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Descreva o problema *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={1000} placeholder="Ex.: o ar-condicionado não está ligando..." /></div><Button className="w-full" disabled={createOrder.isPending} onClick={() => void submit()}>{createOrder.isPending ? "Enviando chamado…" : "Abrir chamado"}</Button></CardContent></Card>

  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /> Meus chamados</CardTitle><CardDescription>As atualizações feitas pela operação aparecem aqui automaticamente.</CardDescription></CardHeader><CardContent>{maintenanceOrders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum chamado aberto ainda.</p> : <div className="divide-y">{maintenanceOrders.map((order) => { let details: any = {}; try { details = JSON.parse(order.details || "{}"); } catch {} return <div key={order.id} className="space-y-1 py-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{details.categoria || "Manutenção"} · {order.order_number}</p><Badge variant={statusTone(order.status)}>{orderStatusLabels[order.status]}</Badge></div><p className="text-sm text-muted-foreground">{details.descricao || "Chamado de manutenção"}</p><p className="text-xs text-muted-foreground">{order.apartments?.code || details.imovel || "Imóvel não identificado"} · atualizado {formatDateTime(order.updated_at || order.created_at)}</p></div>; })}</div>}</CardContent></Card></div></DashboardShell>;
}
