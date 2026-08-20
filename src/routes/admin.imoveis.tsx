import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Edit2, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminNav } from "@/lib/nav";

export const Route = createFileRoute("/admin/imoveis")({ component: AdminImoveis });
type Apartment = { id: string; code: string | null; name: string; address: string; city: string; state: string | null; host_id: string; is_active: boolean };
type Host = { id: string; name: string };

export function AdminImoveis() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", address: "", city: "", state: "", host_id: "", is_active: true });
  const load = async () => {
    const [apartmentsResult, profilesResult, rolesResult] = await Promise.all([
      supabase.from("apartments").select("id, code, name, address, city, state, host_id, is_active").order("code"),
      (supabase as any).from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (apartmentsResult.error) return toast.error(apartmentsResult.error.message);
    if (profilesResult.error || rolesResult.error) return toast.error("Não foi possível carregar proprietários.");
    setApartments(apartmentsResult.data);
    const profileNames = new Map((profilesResult.data ?? []).map((profile: any) => [profile.id, profile.full_name]));
    setHosts((rolesResult.data ?? []).filter((item) => item.role === "host").map((item) => ({ id: item.user_id, name: profileNames.get(item.user_id) || "Proprietário" })));
  };
  useEffect(() => { void load(); }, []);
  const openNew = () => { setEditing(null); setForm({ code: "", name: "", address: "", city: "", state: "", host_id: hosts[0]?.id ?? "", is_active: true }); setOpen(true); };
  const openEdit = (apartment: Apartment) => { setEditing(apartment); setForm({ code: apartment.code ?? "", name: apartment.name, address: apartment.address, city: apartment.city, state: apartment.state ?? "", host_id: apartment.host_id, is_active: apartment.is_active }); setOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.host_id) return toast.error("Cadastre um proprietário antes de criar o imóvel.");
    const data = { ...form, code: form.code.toUpperCase().trim(), state: form.state || null };
    const query = editing ? supabase.from("apartments").update(data).eq("id", editing.id) : supabase.from("apartments").insert(data);
    const { error } = await query;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Imóvel atualizado." : "Imóvel cadastrado."); setOpen(false); void load();
  };
  const remove = async (id: string) => { if (!confirm("Excluir este imóvel?")) return; const { error } = await supabase.from("apartments").delete().eq("id", id); if (error) return toast.error(error.message); toast.success("Imóvel excluído."); void load(); };
  const hostName = (id: string) => hosts.find((host) => host.id === id)?.name || "Não informado";
  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Gestão de Imóveis" subtitle="Dados reais sincronizados com hóspedes e proprietários."><div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Base de Apartamentos ({apartments.length})</h2><p className="text-xs text-muted-foreground">Nenhum dado demonstrativo é exibido.</p></div><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo imóvel</Button></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{apartments.map((apartment) => <Card key={apartment.id}><CardHeader><div className="flex items-center justify-between"><Badge variant="outline">{apartment.code || "Sem código"}</Badge><Badge variant={apartment.is_active ? "default" : "secondary"}>{apartment.is_active ? "Ativo" : "Inativo"}</Badge></div><CardTitle className="mt-2">{apartment.name}</CardTitle><CardDescription>Proprietário: {hostName(apartment.host_id)}</CardDescription></CardHeader><CardContent><p className="text-xs text-muted-foreground">{apartment.address}, {apartment.city}{apartment.state ? ` - ${apartment.state}` : ""}</p><div className="mt-4 flex justify-end gap-2 border-t pt-3"><Button variant="ghost" size="sm" onClick={() => openEdit(apartment)}><Edit2 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(apartment.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></CardContent></Card>)}{!apartments.length && <div className="col-span-full rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"><Building2 className="mx-auto mb-2 h-6 w-6" />Nenhum imóvel cadastrado.</div>}</div></div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar imóvel" : "Novo imóvel"}</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={save}><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Código: S-101" required /><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do imóvel" required /><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Endereço" required /><div className="grid grid-cols-2 gap-3"><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Cidade" required /><Input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="UF" /></div><Label>Proprietário</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.host_id} onChange={(event) => setForm({ ...form, host_id: event.target.value })} required><option value="">Selecione</option>{hosts.map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />Ativo</label><Button className="w-full" type="submit">Salvar</Button></form></DialogContent></Dialog></DashboardShell>;
}
