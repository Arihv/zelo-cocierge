import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { findApartmentIdByCode, useCreateOrder } from "@/lib/api";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/manutencao")({ component: GuestMaintenancePage });
const categories = ["Elétrica", "Hidráulica", "Climatização", "Eletrodoméstico", "Mobiliário", "Outro"];
const priorities = [{ id: "baixa", label: "Baixa" }, { id: "media", label: "Média" }, { id: "alta", label: "Alta" }, { id: "urgente", label: "Urgente" }];

function GuestMaintenancePage() {
  const { profile } = useAuth();
  const createOrder = useCreateOrder();
  const [apartmentCode, setApartmentCode] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");
  const submit = async () => {
    if (!apartmentCode.trim()) { toast.error("Informe o código do imóvel da hospedagem."); return; }
    if (!description.trim()) { toast.error("Descreva o problema para a equipe."); return; }
    try {
      const apartmentId = await findApartmentIdByCode(apartmentCode);
      await createOrder.mutateAsync({ category: "manutencao", total: 0, apartmentId, reservationId: null, details: JSON.stringify({ solicitante: profile?.full_name || "Hóspede", perfil: "Hóspede", imovel: apartmentCode.trim().toUpperCase(), categoria: category, prioridade: priority, descricao: description.trim() }) });
      setDescription(""); toast.success("Chamado enviado! A administração foi notificada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o chamado."); }
  };
  return <DashboardShell nav={guestNav} role="Hóspede" logoutTo="/hospede/login" title="Manutenção" subtitle="Abra um chamado informando o imóvel da sua hospedagem."><Card className="max-w-2xl border-border/60 shadow-soft"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Novo chamado</CardTitle><CardDescription>Você não precisa ter uma reserva cadastrada no Zelo. O chamado ficará registrado no histórico e será direcionado à administração.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2 sm:max-w-[10rem]"><Label>Código do imóvel *</Label><Input value={apartmentCode} onChange={(e) => setApartmentCode(e.target.value.toUpperCase())} placeholder="Ex.: S101" className="font-mono uppercase" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Prioridade</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Descreva o problema *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={1000} placeholder="Ex.: o ar-condicionado não está ligando..." /></div><Button className="w-full" disabled={createOrder.isPending} onClick={() => void submit()}>{createOrder.isPending ? "Enviando chamado…" : "Abrir chamado"}</Button></CardContent></Card></DashboardShell>;
}
