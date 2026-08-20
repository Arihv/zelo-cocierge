import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { apartments } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [prio, setPrio] = useState("media");
  return (
    <DashboardShell title="Manutenção" subtitle="Abra um chamado por categoria e prioridade." role="Proprietário" nav={ownerNav} logoutTo="/">
      <Card className="border-border/60 p-6 shadow-elegant max-w-2xl">
        <h3 className="font-serif text-xl font-semibold">Novo chamado</h3>
        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Chamado aberto."); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Categoria</Label>
              <Select defaultValue="Elétrica">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Apartamento</Label>
              <Select defaultValue={apartments[0]?.code}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{apartments.map((a) => <SelectItem key={a.code} value={a.code}>{a.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {priorities.map((p) => (
                <button type="button" key={p.id} onClick={() => setPrio(p.id)} className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  prio === p.id ? p.color + " border-transparent" : "bg-card text-muted-foreground",
                )}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea placeholder="Descreva o problema..." required /></div>
          <div className="space-y-1.5"><Label>Data desejada</Label><Input type="date" /></div>
          <Button type="submit" className="w-full h-11">Abrir chamado</Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
