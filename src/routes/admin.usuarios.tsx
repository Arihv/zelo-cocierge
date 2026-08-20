import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Edit2, KeyRound, Shield, UserCheck, Users, Wifi } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/usuarios")({ component: AdminUsuarios });

type RoleLabel = "Hóspede" | "Proprietário" | "Administrador";
type UserItem = { id: string; nome: string; email: string; role: RoleLabel; createdAt: string; vinculados: string[]; online: boolean };

const roleLabel = (role: string | null): RoleLabel => role === "admin" ? "Administrador" : role === "host" ? "Proprietário" : "Hóspede";
const roleValue = (role: RoleLabel) => role === "Administrador" ? "admin" : role === "Proprietário" ? "host" : "guest";

export function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [nome, setNome] = useState("");
  const [role, setRole] = useState<RoleLabel>("Hóspede");
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [profilesResult, rolesResult, apartmentsResult, reservationsResult] = await Promise.all([
      (supabase as any).from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      (supabase as any).from("apartments").select("id, name, host_id"),
      (supabase as any).from("reservations").select("guest_id, apartment_id, apartments(name)"),
    ]);

    if (profilesResult.error || rolesResult.error || apartmentsResult.error || reservationsResult.error) {
      toast.error("Não foi possível carregar todos os vínculos de usuários.");
      setLoading(false);
      return;
    }

    const links = new Map<string, string[]>();
    const addLink = (userId: string | null, link: string) => {
      if (!userId) return;
      links.set(userId, [...(links.get(userId) ?? []), link]);
    };
    (apartmentsResult.data ?? []).forEach((apartment: any) => addLink(apartment.host_id, `Proprietário de ${apartment.name}`));
    (reservationsResult.data ?? []).forEach((reservation: any) => {
      const apartment = Array.isArray(reservation.apartments) ? reservation.apartments[0] : reservation.apartments;
      addLink(reservation.guest_id, `Hóspede em ${apartment?.name ?? "imóvel não identificado"}`);
    });

    const roles = new Map((rolesResult.data ?? []).map((item) => [item.user_id, item.role]));
    setUsuarios((profilesResult.data ?? []).map((profile: any) => ({
      id: profile.id,
      nome: profile.full_name || "Usuário sem nome",
      email: profile.email || "E-mail indisponível",
      role: roleLabel(roles.get(profile.id) ?? null),
      createdAt: profile.created_at,
      vinculados: links.get(profile.id) ?? [],
      online: profile.id === currentUser?.id,
    })));
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    void loadUsers();
    const channel = supabase
      .channel("admin-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => void loadUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => void loadUsers())
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [loadUsers]);

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setNome(user.nome);
    setRole(user.role);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !nome.trim()) return;
    setSaving(true);
    const [profileResult, roleResult] = await Promise.all([
      (supabase as any).from("profiles").update({ full_name: nome.trim() }).eq("id", editing.id),
      supabase.from("user_roles").update({ role: roleValue(role) }).eq("user_id", editing.id),
    ]);
    setSaving(false);
    if (profileResult.error || roleResult.error) {
      toast.error(profileResult.error?.message || roleResult.error?.message || "Não foi possível salvar o usuário.");
      return;
    }
    toast.success("Dados e permissões atualizados.");
    setEditing(null);
    void loadUsers();
  };

  const sendPasswordReset = async (user: UserItem) => {
    if (!user.email || user.email === "E-mail indisponível") return;
    setResettingId(user.id);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setResettingId(null);
    if (error) {
      toast.error("Não foi possível enviar o e-mail de redefinição.");
      return;
    }
    toast.success(`Enviamos um link seguro de redefinição para ${user.email}.`);
  };

  const onlineCount = usuarios.filter((user) => user.online).length;
  return (
    <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Gestão de Usuários" subtitle="Controle perfis, permissões e os vínculos de cada pessoa com a operação.">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Sessão atual</span><Wifi className="h-4 w-4 text-emerald-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{onlineCount} online</div><p className="mt-1 text-xs text-muted-foreground">Apenas a sessão deste navegador é indicada aqui.</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Total cadastrado</span><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{usuarios.length} usuários</div><p className="mt-1 text-xs text-muted-foreground">Contas registradas no Supabase Auth.</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Segurança de senha</span><Shield className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">Protegida</div><p className="mt-1 text-xs text-muted-foreground">Senhas não são exibidas nem recuperáveis.</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Base de contas cadastradas</CardTitle><CardDescription>Edite nome e permissões. Para senha, envie um link de redefinição ao titular.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <div className="py-8 text-center text-sm text-muted-foreground">Carregando usuários…</div> : null}
            {!loading && usuarios.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada.</div> : null}
            {usuarios.map((user) => <div key={user.id} className="flex flex-col justify-between gap-4 rounded-xl border bg-card/60 p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{user.nome}</p><Badge variant={user.role === "Administrador" ? "default" : "secondary"}>{user.role}</Badge>{user.online ? <span className="text-xs text-emerald-600">Sessão atual</span> : null}</div>
                <p className="text-sm text-muted-foreground">{user.email} • Cadastrado em {new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{user.vinculados.length ? user.vinculados.join(" • ") : "Sem imóvel ou reserva vinculada"}</p>
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(user)} className="gap-1"><Edit2 className="h-3.5 w-3.5" /> Editar</Button><Button variant="outline" size="sm" onClick={() => void sendPasswordReset(user)} disabled={resettingId === user.id} className="gap-1"><KeyRound className="h-3.5 w-3.5" /> {resettingId === user.id ? "Enviando…" : "Redefinir senha"}</Button></div>
            </div>)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Editar usuário</DialogTitle><DialogDescription>O e-mail de login e a senha não são alterados nesta tela.</DialogDescription></DialogHeader>
          <form onSubmit={saveUser} className="space-y-4"><div className="space-y-1.5"><Label>Nome completo</Label><Input value={nome} onChange={(event) => setNome(event.target.value)} required /></div><div className="space-y-1.5"><Label>E-mail de login</Label><Input value={editing?.email ?? ""} disabled /></div><div className="space-y-1.5"><Label>Papel de acesso</Label><select value={role} onChange={(event) => setRole(event.target.value as RoleLabel)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="Hóspede">Hóspede</option><option value="Proprietário">Proprietário</option><option value="Administrador">Administrador</option></select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
