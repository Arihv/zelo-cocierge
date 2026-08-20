import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  KeyRound, 
  MapPin, 
  CalendarDays, 
  ShoppingBag, 
  Clock, 
  Package, 
  PlusCircle,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/hospede/dashboard")({
  component: HospedeDashboard,
});

export function HospedeDashboard() {
  const { user, profile } = useAuth();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Hóspede";

  const [reserva, setReserva] = useState<any | null>(null);
  const [imovel, setImovel] = useState<any | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states para vincular hospedagem manualmente
  const [imoveisDisponiveis, setImoveisDisponiveis] = useState<any[]>([]);
  const [codigoImovelInput, setCodigoImovelInput] = useState("");
  const [checkInInput, setCheckInInput] = useState("");
  const [checkOutInput, setCheckOutInput] = useState("");

  const carregarDadosHospedagem = () => {
    // 1. Carrega imóveis cadastrados
    const imoveisSalvos = localStorage.getItem("estadia_imoveis_data");
    const listaImoveis = imoveisSalvos ? JSON.parse(imoveisSalvos) : [];
    setImoveisDisponiveis(listaImoveis);

    // 2. Busca hospedagem salva especificamente para esta sessão
    const hospedagemVinculada = localStorage.getItem(`estadia_reserva_ativa_${user?.email || "guest"}`);
    
    if (hospedagemVinculada) {
      const parsed = JSON.parse(hospedagemVinculada);
      setReserva(parsed);
      const apMatch = listaImoveis.find((i: any) => i.codigo === parsed.imovelCodigo);
      setImovel(apMatch || {
        codigo: parsed.imovelCodigo,
        nome: `Apartamento ${parsed.imovelCodigo}`,
        endereco: "Endereço cadastrado na plataforma",
      });
    } else {
      // Tenta buscar na lista geral de reservas cadastradas pela administração para este e-mail
      const reservasSalvas = localStorage.getItem("estadia_reservas_data");
      const listaReservas = reservasSalvas ? JSON.parse(reservasSalvas) : [];
      const match = listaReservas.find(
        (r: any) => r.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (match) {
        setReserva(match);
        const apMatch = listaImoveis.find((i: any) => i.codigo === match.imovelCodigo);
        setImovel(apMatch || {
          codigo: match.imovelCodigo,
          nome: `Apartamento ${match.imovelCodigo}`,
          endereco: "Endereço cadastrado na plataforma",
        });
      } else {
        setReserva(null);
        setImovel(null);
      }
    }

    // 3. Busca histórico real de pedidos
    const pedidosSalvos = localStorage.getItem("estadia_historico_pedidos");
    const listaPedidos = pedidosSalvos ? JSON.parse(pedidosSalvos) : [];
    const meusPedidos = listaPedidos.filter(
      (p: any) => p.solicitante?.toLowerCase() === userName.toLowerCase() || p.solicitante?.toLowerCase() === user?.email?.toLowerCase()
    );
    setPedidos(meusPedidos);
  };

  useEffect(() => {
    carregarDadosHospedagem();
  }, [user, userName]);

  const handleSalvarHospedagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoImovelInput) {
      toast.error("Selecione ou digite o código do seu apartamento.");
      return;
    }

    const imovelEncontrado = imoveisDisponiveis.find((i) => i.codigo === codigoImovelInput);
    
    const novaReserva = {
      id: "res-guest-" + Date.now(),
      codigoReserva: "RES-" + Math.floor(1000 + Math.random() * 9000),
      hospede: userName,
      email: user?.email || "",
      imovelCodigo: codigoImovelInput,
      checkIn: checkInInput || "2026-08-18",
      checkOut: checkOutInput || "2026-08-25",
      status: "Confirmada",
    };

    localStorage.setItem(`estadia_reserva_ativa_${user?.email || "guest"}`, JSON.stringify(novaReserva));
    
    // Atualiza base geral de reservas
    const reservasGerais = JSON.parse(localStorage.getItem("estadia_reservas_data") || "[]");
    localStorage.setItem("estadia_reservas_data", JSON.stringify([novaReserva, ...reservasGerais]));

    setReserva(novaReserva);
    setImovel(imovelEncontrado || {
      codigo: codigoImovelInput,
      nome: `Apartamento ${codigoImovelInput}`,
      endereco: "Endereço cadastrado",
    });

    toast.success("Hospedagem vinculada com sucesso!");
    setModalOpen(false);
  };

  // Contadores Reais
  const kitsCount = pedidos.filter((p) => p.categoria?.toLowerCase().includes("kit")).length;
  const mercadoCount = pedidos.filter((p) => p.categoria?.toLowerCase().includes("mercado")).length;
  const pedidosEmAndamento = pedidos.filter((p) => p.status !== "Concluído" && p.status !== "Cancelado").length;

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/hospede/login"
      title={`Olá, ${userName.split(" ")[0]}`}
      subtitle="Bem-vindo(a) de volta à sua estadia."
    >
      <div className="space-y-6">
        {/* Card Principal de Vinculação */}
        <Card className="border-border/70 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Sua Hospedagem Ativa
            </span>
            {reserva && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{reserva.status || "Confirmada"}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setCodigoImovelInput(reserva.imovelCodigo);
                    setCheckInInput(reserva.checkIn);
                    setCheckOutInput(reserva.checkOut);
                    setModalOpen(true);
                  }}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" /> Trocar Imóvel
                </Button>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            {reserva ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-foreground">
                      {imovel?.nome || `Apartamento ${reserva.imovelCodigo}`}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {imovel?.endereco || "Endereço cadastrado na plataforma"}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/80 rounded-lg text-xs font-mono font-bold">
                    Código do Imóvel: <span className="text-primary text-sm">{reserva.imovelCodigo}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-card">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-muted-foreground block">Data de Check-in</span>
                      <span className="text-sm font-bold text-foreground">{reserva.checkIn}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-card">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-muted-foreground block">Data de Check-out</span>
                      <span className="text-sm font-bold text-foreground">{reserva.checkOut}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Nenhum apartamento selecionado</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Para solicitar comodidades, kit de boas-vindas e serviços, informe em qual acomodação você está hospedado(a).
                  </p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Informar meu Apartamento / Reserva
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas Reais */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kits Solicitados</span>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kitsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Café da manhã e refeições</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens de Mercado</span>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mercadoCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Compras para o apartamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pedidos em Andamento</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pedidosEmAndamento}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando entrega ou preparo</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico Real de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Pedidos</CardTitle>
            <CardDescription>Acompanhe o status dos seus serviços em tempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Você ainda não realizou nenhum pedido nesta hospedagem.
              </div>
            ) : (
              <div className="divide-y">
                {pedidos.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {p.id}
                        </span>
                        <span className="font-semibold text-sm">{p.categoria}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.itens}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm block">{p.valor}</span>
                      <Badge variant={p.status === "Concluído" ? "default" : "secondary"} className="text-[10px]">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Seleção de Hospedagem */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Minha Estadia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSalvarHospedagem} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Escolha seu Apartamento</Label>
                {imoveisDisponiveis.length > 0 ? (
                  <select
                    value={codigoImovelInput}
                    onChange={(e) => setCodigoImovelInput(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                    required
                  >
                    <option value="">Selecione um apartamento cadastrado...</option>
                    {imoveisDisponiveis.map((imv) => (
                      <option key={imv.id} value={imv.codigo}>
                        {imv.codigo} - {imv.nome} ({imv.tipo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={codigoImovelInput}
                    onChange={(e) => setCodigoImovelInput(e.target.value)}
                    placeholder="Ex: S-102, D-204 ou T-301"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data de Check-in</Label>
                  <Input 
                    type="date" 
                    value={checkInInput} 
                    onChange={(e) => setCheckInInput(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Check-out</Label>
                  <Input 
                    type="date" 
                    value={checkOutInput} 
                    onChange={(e) => setCheckOutInput(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">
                Confirmar Hospedagem
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}