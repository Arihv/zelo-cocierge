import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrder, useMyReservation } from "@/lib/api";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/manutencao")({ component: GuestMaintenancePage });
const categories = ["Elétrica", "Hidráulica", "Climatização", "Eletrodoméstico", "Mobiliário", "Outro"];
const priorities = [{ id: "baixa", label: "Baixa" }, { id: "media", label: "Média" }, { id: "alta", label: "Alta" }, { id: "urgente", label: "Urgente" }];

function GuestMaintenancePage() {
  const { data: reservation, isLoading } = useMyReservation();
  const createOrder = useCreateOrder();
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");
  if (isLoading) return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Manutenção" subtitle="Solicite ajuda para o imóvel."><p className="text-sm text-muted-foreground">Carregando sua reserva…</p></DashboardShell>;
  const submit = async () => {
    if (!reservation) { toast.error("Não encontramos uma reserva ativa vinculada à sua conta."); return; }
    if (!description.trim()) { toast.error("Descreva o problema para a equipe."); return; }
    try {
      await createOrder.mutateAsync({ category: "manutencao", total: 0, apartmentId: reservation.apartment_id, reservationId: reservation.id, details: JSON.stringify({ solicitante: reservation.guest_name || "Hóspede", perfil: "Hóspede", imovel: reservation.apartments?.code || reservation.apartment_id, categoria: category, prioridade: priority, descricao: description.trim() }) });
      setDescription(""); toast.success("Chamado enviado! A administração e o proprietário foram notificados.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o chamado."); }
  };
  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Manutenção" subtitle="Abra um chamado para o imóvel da sua reserva."><Card className="max-w-2xl border-border/60 shadow-soft"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Novo chamado</CardTitle><CardDescription>Imóvel {reservation?.apartments?.code || "—"}. O chamado ficará registrado no histórico e será direcionado à administração e ao proprietário.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Prioridade</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Descreva o problema *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={1000} placeholder="Ex.: o ar-condicionado não está ligando..." /></div><Button className="w-full" disabled={createOrder.isPending || !reservation} onClick={() => void submit()}>{createOrder.isPending ? "Enviando chamado…" : "Abrir chamado"}</Button></CardContent></Card></DashboardShell>;
}
