import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Wifi, Shield, UserCheck, Smartphone, Laptop, Plus, Trash2, Edit2, AlertTriangle, UserMinus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuarios,
});

export interface UserItem {
  id: string;
  nome: string;
  email: string;
  role: "Hóspede" | "Proprietário" | "Administrador";
  status: "online" | "offline";
  dispositivo: string;
  ultimoAcesso: string;
  imovel?: string;
  password?: string;
}

export function AdminUsuarios() {
  const { user: currentAuthUser, profile: currentAuthProfile } = useAuth();
  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UserItem | null>(null);
  const [editando, setEditando] = useState<UserItem | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<UserItem["role"]>("Hóspede");
  const [imovel, setImovel] = useState("S-102");
  const [modalTab, setModalTab] = useState<"cadastrar" | "excluir">("cadastrar");
  const [emailParaExcluirDireto, setEmailParaExcluirDireto] = useState("");

  const carregarUsuariosReais = async () => {
    const listaFinal: UserItem[] = [];

    // 1. Administrador Conectado
    const adminAtual: UserItem = {
      id: currentAuthUser?.id || "admin-main",
      nome: currentAuthProfile?.full_name || "Administrador da Operação",
      email: currentAuthUser?.email || "admin@estadia.com",
      role: "Administrador",
      status: "online",
      dispositivo: `${navigator.platform || "PC"} • Navegador Web`,
      ultimoAcesso: "Agora mesmo",
      imovel: "Central de Operações",
    };
    listaFinal.push(adminAtual);

    // 2. Perfis e papéis reais criados pelo Supabase Auth.
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        (supabase as any).from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const { data, error } = profilesResult;
      if (rolesResult.error) throw rolesResult.error;
      const roles = new Map((rolesResult.data ?? []).map((item) => [item.user_id, item.role]));

      if (!error && data && data.length > 0) {
        data.forEach((p: any) => {
          if (p.id !== adminAtual.id) {
            const storedRole = roles.get(p.id);
            const formatRole =
              storedRole === "admin"
                ? "Administrador"
                : storedRole === "host"
                ? "Proprietário"
                : "Hóspede";

            listaFinal.push({
              id: p.id,
              nome: p.full_name || "Usuário Cadastrado",
              email: p.email || "E-mail protegido",
              role: formatRole,
              status: "offline",
              dispositivo: "Conta Supabase",
              ultimoAcesso: p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "Recentemente",
              imovel: "Não vinculado",
            });
          }
        });
      }
    } catch (err) {
      console.warn("Falha ao carregar do Supabase:", err);
    }

    setUsuarios(listaFinal);
  };

  useEffect(() => {
    carregarUsuariosReais();

    // Sincronização em tempo real nativa
    const channel = supabase
      .channel("realtime-users-profiles-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        carregarUsuariosReais();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAuthUser, currentAuthProfile]);

  const onlineUsers = usuarios.filter((u) => u.status === "online");

  const abrirModalNovo = () => {
    setEditando(null);
    setNome("");
    setEmail("");
    setPassword("123456");
    setRole("Hóspede");
    setImovel("S-102");
    setModalTab("cadastrar");
    setModalOpen(true);
  };

  const abrirModalEditar = (u: UserItem) => {
    setEditando(u);
    setNome(u.nome);
    setEmail(u.email);
    setPassword(u.password || "123456");
    setRole(u.role);
    setImovel(u.imovel || "");
    setModalTab("cadastrar");
    setModalOpen(true);
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const roleSlug = role === "Administrador" ? "admin" : role === "Proprietário" ? "host" : "guest";

    if (editando) {
      try {
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .update({ full_name: nome, email: email.toLowerCase().trim() })
          .eq("id", editando.id);
        if (profileError) throw profileError;
        const { error: roleError } = await supabase.from("user_roles").update({ role: roleSlug }).eq("user_id", editando.id);
        if (roleError) throw roleError;

        toast.success("Usuário atualizado com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar usuário no banco.");
      }
    } else {
      toast.error("A conta deve ser criada pela tela de cadastro para que o Supabase Auth registre a senha com segurança.");
      return;
    }

    setModalOpen(false);
    carregarUsuariosReais();
  };

  const executarExclusaoPorEmail = () => {
    const usuarioAlvo = usuarios.find(
      (u) => u.email.toLowerCase() === emailParaExcluirDireto.toLowerCase().trim()
    );

    if (!usuarioAlvo) {
      toast.error("E-mail não encontrado na base de usuários.");
      return;
    }

    if (usuarioAlvo.email === "admin@estadia.com") {
      toast.error("O administrador principal não pode ser removido.");
      return;
    }

    setUsuarioParaExcluir(usuarioAlvo);
    setModalOpen(false);
    setModalDeleteOpen(true);
  };

  const executarExclusao = async () => {
    if (!usuarioParaExcluir) return;

    try {
      throw new Error("A exclusão de contas exige uma função administrativa segura no servidor.");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Gestão de Usuários"
      subtitle="Controle de acessos, permissões e monitoramento de pessoas conectadas em tempo real."
    >
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">Pessoas Conectadas</span>
              <Wifi className="h-4 w-4 text-emerald-600 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{onlineUsers.length} online</div>
              <p className="text-xs text-muted-foreground mt-1">Sessões ativas no momento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Cadastrados</span>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usuarios.length} usuários</div>
              <p className="text-xs text-muted-foreground mt-1">Contas ativas no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-muted-foreground">Nível de Segurança</span>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ativo</div>
              <p className="text-xs text-muted-foreground mt-1">Sessões monitoradas via Supabase</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Listagem */}
        <Tabs defaultValue="todos" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="todos" className="gap-2">
                <UserCheck className="h-4 w-4" />
                Todos os Usuários ({usuarios.length})
              </TabsTrigger>
              <TabsTrigger value="online" className="gap-2">
                <Wifi className="h-4 w-4 text-emerald-600" />
                Conectados Agora ({onlineUsers.length})
              </TabsTrigger>
            </TabsList>

            <Button onClick={abrirModalNovo} size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Adicionar / Gerenciar Usuários
            </Button>
          </div>

          {/* Lista Completa */}
          <TabsContent value="todos">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Base de Contas Cadastradas</CardTitle>
                <CardDescription>Lista completa de perfis. Você pode editar permissões ou remover contas a qualquer momento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {usuarios.map((u) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card/60 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{u.nome}</p>
                        <Badge variant={u.role === "Administrador" ? "default" : "secondary"} className="text-[10px]">
                          {u.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {u.email} {u.imovel && u.imovel !== "Não vinculado" ? `• Imóvel: ${u.imovel}` : ""} • Senha: <code className="bg-muted px-1 rounded">{u.password || "123456"}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${u.status === "online" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                        {u.status === "online" ? "Online" : "Offline"}
                      </span>

                      <Button variant="outline" size="sm" onClick={() => abrirModalEditar(u)} className="h-8 gap-1 text-xs cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" /> Editar
                      </Button>

                      {u.email !== "admin@estadia.com" ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setUsuarioParaExcluir(u);
                            setModalDeleteOpen(true);
                          }} 
                          className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic px-2">Admin Principal</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conectados */}
          <TabsContent value="online">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sessões Ativas no Sistema</CardTitle>
                <CardDescription>Usuários conectados na plataforma neste instante.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card/60 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 bg-secondary/80 px-2.5 py-1 rounded-md">
                        {u.dispositivo.includes("iPhone") || u.dispositivo.includes("Android") ? (
                          <Smartphone className="h-3.5 w-3.5" />
                        ) : (
                          <Laptop className="h-3.5 w-3.5" />
                        )}
                        {u.dispositivo}
                      </span>
                      <Badge variant="outline">{u.role}</Badge>
                      
                      {u.email !== "admin@estadia.com" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setUsuarioParaExcluir(u);
                            setModalDeleteOpen(true);
                          }} 
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Gestão */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md text-left">
            <DialogHeader>
              <DialogTitle>
                {editando ? "Editar Usuário" : "Gerenciar Usuários"}
              </DialogTitle>
            </DialogHeader>

            {!editando && (
              <Tabs value={modalTab} onValueChange={(v) => setModalTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="cadastrar" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Cadastrar Novo
                  </TabsTrigger>
                  <TabsTrigger value="excluir" className="gap-1.5 text-xs text-destructive data-[state=active]:text-destructive">
                    <UserMinus className="h-3.5 w-3.5" /> Excluir por E-mail
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="excluir" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Selecione o e-mail para remoção</Label>
                    <select
                      value={emailParaExcluirDireto}
                      onChange={(e) => setEmailParaExcluirDireto(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                    >
                      <option value="">Escolha um usuário cadastrado...</option>
                      {usuarios
                        .filter((u) => u.email !== "admin@estadia.com")
                        .map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.nome} ({u.email}) - {u.role}
                          </option>
                        ))}
                    </select>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    A remoção do usuário revoga instantaneamente o acesso à plataforma.
                  </p>

                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={executarExclusaoPorEmail}
                    disabled={!emailParaExcluirDireto}
                    className="w-full gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir Este Usuário
                  </Button>
                </TabsContent>
              </Tabs>
            )}

            {(modalTab === "cadastrar" || editando) && (
              <form onSubmit={handleSalvarUsuario} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome Completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Carlos Eduardo" />
                </div>

                <div className="space-y-1.5">
                  <Label>E-mail de Login</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="carlos@exemplo.com" />
                </div>

                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="123456" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Papel de Acesso</Label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                    >
                      <option value="Hóspede">Hóspede</option>
                      <option value="Proprietário">Proprietário</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Imóvel Vinculado</Label>
                    <Input value={imovel} onChange={(e) => setImovel(e.target.value)} placeholder="Ex: S-102" className="uppercase" />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button type="submit" className="w-full cursor-pointer">
                    {editando ? "Salvar Alterações" : "Cadastrar e Liberar Acesso"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
          <DialogContent className="text-left">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle>Confirmar Remoção de Usuário</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                Tem certeza que deseja remover o usuário <strong>{usuarioParaExcluir?.nome}</strong> ({usuarioParaExcluir?.email})? Esta ação revoga o acesso da plataforma.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button variant="outline" onClick={() => setModalDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={executarExclusao} className="cursor-pointer">
                Sim, Remover Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
