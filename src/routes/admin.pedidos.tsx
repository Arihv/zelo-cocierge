import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, AlertTriangle, PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useOrdersStore, type OrderItem } from "@/hooks/use-orders-store";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminPedidos,
});

export function AdminPedidos() {
  const { orders, loading, addOrder, updateOrderStatus, removeOrder } = useOrdersStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<OrderItem | null>(null);
  const [editando, setEditando] = useState<OrderItem | null>(null);

  // Form states
  const [solicitante, setSolicitante] = useState("");
  const [perfil, setPerfil] = useState<OrderItem["perfil"]>("Hóspede");
  const [imovel, setImovel] = useState("");
  const [categoria, setCategoria] = useState<OrderItem["categoria"]>("Serviços");
  const [itens, setItens] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<OrderItem["status"]>("Recebido");

  const alterarStatus = (id: string, novoStatus: OrderItem["status"]) => {
    updateOrderStatus(id, novoStatus);
    toast.success(`Status atualizado para "${novoStatus}"`);
  };

  const abrirModalNovo = () => {
    setEditando(null);
    setSolicitante("");
    setPerfil("Hóspede");
    setImovel("");
    setCategoria("Serviços");
    setItens("");
    setValor("");
    setStatus("Recebido");
    setModalOpen(true);
  };

  const abrirModalEditar = (p: OrderItem) => {
    setEditando(p);
    setSolicitante(p.solicitante);
    setPerfil(p.perfil);
    setImovel(p.imovel || "");
    setCategoria(p.categoria);
    setItens(p.itens);
    setValor(p.valor);
    setStatus(p.status);
    setModalOpen(true);
  };

  const handleSalvarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorFormatado = valor.startsWith("R$") ? valor : `R$ ${valor}`;

    if (editando) {
      await updateOrderStatus(editando.id, status);
      toast.success("Pedido atualizado com sucesso!");
    } else {
      await addOrder({
        solicitante,
        perfil,
        imovel: (imovel || "S-102").toUpperCase().trim(),
        categoria,
        itens,
        valor: valorFormatado,
        status,
      });
      toast.success("Novo pedido registrado na operação!");
    }

    setModalOpen(false);
  };

  const confirmarExclusao = (p: OrderItem) => {
    setPedidoParaExcluir(p);
    setModalDeleteOpen(true);
  };

  const executarExclusao = async () => {
    if (!pedidoParaExcluir) return;
    await removeOrder(pedidoParaExcluir.id);
    toast.success(`Pedido ${pedidoParaExcluir.id} excluído com sucesso.`);
    setModalDeleteOpen(false);
    setPedidoParaExcluir(null);
  };

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Gestão de Pedidos & Demandas"
      subtitle="Acompanhe e atualize as solicitações reais de hóspedes e proprietários."
    >
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        {/* Métricas Reais Calculadas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 text-left">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Em Preparação / Recebido</span>
              <CardTitle className="text-2xl font-bold text-amber-600">
                {orders.filter((p) => p.status === "Em Preparação" || p.status === "Recebido").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 text-left">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Em Entrega / Andamento</span>
              <CardTitle className="text-2xl font-bold text-primary">
                {orders.filter((p) => p.status === "Em Preparação").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 text-left">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Total Entregues / Concluídos</span>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                {orders.filter((p) => p.status === "Entregue").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Lista Real de Pedidos */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div>
              <CardTitle className="text-lg">Todos os Pedidos do Sistema ({orders.length})</CardTitle>
              <CardDescription>Altere os status para atualizar o painel do cliente em tempo real.</CardDescription>
            </div>
            <Button onClick={abrirModalNovo} size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Registrar Pedido Manual
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Carregando pedidos da nuvem...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base">Nenhum pedido registrado no momento</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Assim que um hóspede solicitar serviços ou um proprietário pedir manutenção, as demandas aparecerão listadas aqui em tempo real.
                </p>
              </div>
            ) : (
              orders.map((p) => (
                <div key={p.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-xl border bg-card/60 gap-4 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {p.id}
                      </span>
                      <span className="font-semibold text-sm">{p.solicitante} ({p.perfil})</span>
                      {p.imovel && <Badge variant="outline">{p.imovel}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{p.categoria}:</span> {p.itens}
                    </p>
                    <p className="text-xs font-semibold text-primary">{p.valor} • {p.data || "Hoje"}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={p.status}
                      onChange={(e) => alterarStatus(p.id, e.target.value as OrderItem["status"])}
                      className="h-9 px-3 border rounded-md text-xs font-medium bg-background cursor-pointer"
                    >
                      <option value="Recebido">Recebido</option>
                      <option value="Em Preparação">Em Preparação</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>

                    <Button variant="outline" size="sm" onClick={() => abrirModalEditar(p)} className="h-9 gap-1 text-xs cursor-pointer">
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => confirmarExclusao(p)} 
                      className="h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Modal Adicionar / Editar */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="text-left">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Pedido" : "Registrar Novo Pedido na Operação"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSalvarPedido} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome do Solicitante</Label>
                  <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} required placeholder="Ex: Ariane" />
                </div>
                <div className="space-y-1.5">
                  <Label>Perfil</Label>
                  <select
                    value={perfil}
                    onChange={(e) => setPerfil(e.target.value as any)}
                    className="w-full h-10 px-3 border rounded-md text-sm bg-background cursor-pointer"
                  >
                    <option value="Hóspede">Hóspede</option>
                    <option value="Proprietário">Proprietário</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código do Imóvel</Label>
                  <Input value={imovel} onChange={(e) => setImovel(e.target.value)} placeholder="Ex: S-102" />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="w-full h-10 px-3 border rounded-md text-sm bg-background cursor-pointer"
                  >
                    <option value="Serviços">Serviços</option>
                    <option value="Minimercado">Minimercado</option>
                    <option value="Kits">Kits</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Itens / Descrição do Pedido</Label>
                <Input value={itens} onChange={(e) => setItens(e.target.value)} required placeholder="Ex: 1x Kit Café Casal" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor Total (R$)</Label>
                  <Input value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="89,90" />
                </div>
                <div className="space-y-1.5">
                  <Label>Status Inicial</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 px-3 border rounded-md text-sm bg-background cursor-pointer"
                  >
                    <option value="Recebido">Recebido</option>
                    <option value="Em Preparação">Em Preparação</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 cursor-pointer">
                {editando ? "Salvar Alterações" : "Criar Pedido"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Exclusão */}
        <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
          <DialogContent className="text-left">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle>Confirmar Exclusão de Pedido</DialogTitle>
              </div>
              <DialogFooter className="pt-2">
                Tem certeza que deseja remover o pedido <strong>{pedidoParaExcluir?.id}</strong>?
              </DialogFooter>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button variant="outline" onClick={() => setModalDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={executarExclusao} className="cursor-pointer">
                Sim, Excluir Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}