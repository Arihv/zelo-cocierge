import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Edit2, Plus, Trash2, UserPlus } from "lucide-react";
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

type Apartment = {
  id: string; code: string | null; name: string; address: string; city: string; state: string | null;
  host_id: string | null; property_owner_id: string | null; is_active: boolean;
};
type OwnerContact = { id: string; full_name: string };
type HostAccount = { id: string; name: string };
const emptyForm = { code: "", name: "", address: "", city: "", state: "", property_owner_id: "", host_id: "", is_active: true };

export function AdminImoveis() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [ownerContacts, setOwnerContacts] = useState<OwnerContact[]>([]);
  const [hostAccounts, setHostAccounts] = useState<HostAccount[]>([]);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [open, setOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [apartmentsResult, contactsResult, profilesResult, rolesResult] = await Promise.all([
      supabase.from("apartments").select("id, code, name, address, city, state, host_id, property_owner_id, is_active").order("code"),
      supabase.from("property_owners").select("id, full_name").order("full_name"),
      (supabase as any).from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (apartmentsResult.error) return toast.error(apartmentsResult.error.message);
    if (contactsResult.error) return toast.error("Não foi possível carregar os proprietários. Execute a migration no Supabase.");
    if (profilesResult.error || rolesResult.error) return toast.error("Não foi possível carregar as contas de acesso.");
    const profileNames = new Map((profilesResult.data ?? []).map((profile: any) => [profile.id, profile.full_name]));
    setApartments(apartmentsResult.data as Apartment[]);
    setOwnerContacts(contactsResult.data ?? []);
    setHostAccounts((rolesResult.data ?? []).filter((item) => item.role === "host").map((item) => ({ id: item.user_id, name: profileNames.get(item.user_id) || "Proprietário" })));
  };

  useEffect(() => { void load(); }, []);
  const openNew = () => { setEditing(null); setForm({ ...emptyForm, property_owner_id: ownerContacts[0]?.id ?? "" }); setOpen(true); };
  const openEdit = (apartment: Apartment) => {
    setEditing(apartment);
    setForm({ code: apartment.code ?? "", name: apartment.name, address: apartment.address, city: apartment.city, state: apartment.state ?? "", property_owner_id: apartment.property_owner_id ?? "", host_id: apartment.host_id ?? "", is_active: apartment.is_active });
    setOpen(true);
  };

  const saveOwner = async (event: React.FormEvent) => {
    event.preventDefault();
    const fullName = ownerName.trim();
    if (!fullName) return toast.error("Informe o nome do proprietário.");
    const { data, error } = await supabase.from("property_owners").insert({ full_name: fullName }).select("id, full_name").single();
    if (error) return toast.error(error.message);
    setOwnerContacts((current) => [...current, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setForm((current) => ({ ...current, property_owner_id: data.id }));
    setOwnerName(""); setOwnerOpen(false);
    toast.success("Proprietário cadastrado para controle interno.");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.property_owner_id) return toast.error("Cadastre ou selecione o proprietário do imóvel.");
    const data = { ...form, code: form.code.toUpperCase().trim(), state: form.state || null, host_id: form.host_id || null };
    const query = editing ? supabase.from("apartments").update(data).eq("id", editing.id) : supabase.from("apartments").insert(data);
    const { error } = await query;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Imóvel atualizado." : "Imóvel cadastrado.");
    setOpen(false); void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este imóvel?")) return;
    const { error } = await supabase.from("apartments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Imóvel excluído."); void load();
  };

  const ownerNameFor = (apartment: Apartment) => ownerContacts.find((owner) => owner.id === apartment.property_owner_id)?.full_name
    || hostAccounts.find((account) => account.id === apartment.host_id)?.name || "Não informado";

  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Gestão de Imóveis" subtitle="Cadastre os imóveis e mantenha o responsável de cada unidade organizado.">
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Base de Apartamentos ({apartments.length})</h2><p className="text-xs text-muted-foreground">Proprietários cadastrados são contatos internos; o login é vinculado somente quando necessário.</p></div><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo imóvel</Button></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{apartments.map((apartment) => <Card key={apartment.id}><CardHeader><div className="flex items-center justify-between"><Badge variant="outline">{apartment.code || "Sem código"}</Badge><Badge variant={apartment.is_active ? "default" : "secondary"}>{apartment.is_active ? "Ativo" : "Inativo"}</Badge></div><CardTitle className="mt-2">{apartment.name}</CardTitle><CardDescription>Proprietário: {ownerNameFor(apartment)}</CardDescription></CardHeader><CardContent><p className="text-xs text-muted-foreground">{apartment.address}, {apartment.city}{apartment.state ? ` - ${apartment.state}` : ""}</p><div className="mt-4 flex justify-end gap-2 border-t pt-3"><Button variant="ghost" size="sm" onClick={() => openEdit(apartment)}><Edit2 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(apartment.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></CardContent></Card>)}{!apartments.length && <div className="col-span-full rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"><Building2 className="mx-auto mb-2 h-6 w-6" />Nenhum imóvel cadastrado.</div>}</div>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar imóvel" : "Novo imóvel"}</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={save}><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Código: S-101" required /><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do imóvel" required /><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Endereço" required /><div className="grid grid-cols-2 gap-3"><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Cidade" required /><Input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="UF" /></div><div className="flex items-center justify-between gap-3"><Label htmlFor="property-owner">Proprietário cadastrado</Label><Button type="button" variant="outline" size="sm" onClick={() => setOwnerOpen(true)}><UserPlus className="mr-1 h-3.5 w-3.5" />Adicionar proprietário</Button></div><select id="property-owner" className="h-10 w-full rounded-md border bg-background px-3" value={form.property_owner_id} onChange={(event) => setForm({ ...form, property_owner_id: event.target.value })} required><option value="">Selecione</option>{ownerContacts.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}</select><p className="text-xs text-muted-foreground">Cadastro interno: não cria login, senha nem envia e-mail.</p><Label htmlFor="host-account">Conta de acesso do proprietário <span className="font-normal text-muted-foreground">(opcional)</span></Label><select id="host-account" className="h-10 w-full rounded-md border bg-background px-3" value={form.host_id} onChange={(event) => setForm({ ...form, host_id: event.target.value })}><option value="">Nenhuma conta vinculada</option>{hostAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><p className="text-xs text-muted-foreground">Vincule somente se a pessoa possuir conta e precisar usar o painel de proprietário.</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />Ativo</label><Button className="w-full" type="submit">Salvar</Button></form></DialogContent></Dialog>
    <Dialog open={ownerOpen} onOpenChange={setOwnerOpen}><DialogContent><DialogHeader><DialogTitle>Adicionar proprietário</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={saveOwner}><div className="space-y-2"><Label htmlFor="owner-name">Nome completo</Label><Input id="owner-name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Nome do proprietário" autoFocus required /></div><p className="text-sm text-muted-foreground">Este é um cadastro interno da Zelo. Nenhum e-mail será enviado e nenhuma conta será criada.</p><Button className="w-full" type="submit">Salvar proprietário</Button></form></DialogContent></Dialog>
  </DashboardShell>;
}
