import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, BedDouble, Sofa, Flame, CheckCircle, Info, QrCode, CreditCard, Copy } from "lucide-react";
import { toast } from "sonner";
import { useOrdersStore } from "@/hooks/use-orders-store";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";

export const Route = createFileRoute("/hospede/servicos")({
  component: HospedeServicosPage,
});

interface ServicoConfig {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  icone: any;
  precoBase: { S: number; D: number; T: number };
  requerCodigo?: boolean;
}

const SERVICOS: ServicoConfig[] = [
  {
    id: "srv-limpeza",
    nome: "Limpeza Completa & Higienização",
    categoria: "Governança",
    descricao: "Faxina geral, troca de lixeiras e reposição de amenities.",
    icone: Sparkles,
    precoBase: { S: 120, D: 160, T: 210 },
  },
  {
    id: "srv-enxoval",
    nome: "Troca de Enxoval e Toalhas",
    categoria: "Governança",
    descricao: "Troca completa de lençóis, fronhas e toalhas higienizadas.",
    icone: BedDouble,
    precoBase: { S: 45, D: 65, T: 85 },
  },
  {
    id: "srv-estofados",
    nome: "Higienização de Sofás & Tapetes",
    categoria: "Governança",
    descricao: "Limpeza profunda especializada para os estofados da unidade.",
    icone: Sofa,
    precoBase: { S: 80, D: 110, T: 140 },
  },
  {
    id: "srv-aquecedor",
    nome: "Aquecedor Portátil Adicional",
    categoria: "Comodidade",
    descricao: "Aluguel de aquecedor elétrico portátil para dias mais frios.",
    icone: Flame,
    precoBase: { S: 35, D: 35, T: 35 },
    requerCodigo: true,
  },
];

export function HospedeServicosPage() {
  const { addOrder } = useOrdersStore();
  const [unidade, setUnidade] = useState("S-102");
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoConfig | null>(null);
  const [codigoAutorizacao, setCodigoAutorizacao] = useState("");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardValid, setCardValid] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const getTipologia = (code: string): "S" | "D" | "T" => {
    const clean = code.trim().toUpperCase();
    if (clean.startsWith("D")) return "D";
    if (clean.startsWith("T")) return "T";
    return "S";
  };

  const currentTipologia = getTipologia(unidade);

  const handleSolicitar = (srv: ServicoConfig) => {
    if (srv.requerCodigo && !codigoAutorizacao.trim()) {
      toast.error("Por favor, digite o código de autorização para este item.");
      return;
    }
    setServicoSelecionado(srv);
    setPaymentModalOpen(true);
  };

  const handleConfirmarPedido = async () => {
    if (!servicoSelecionado) return;

    if (paymentMethod === "cartao" && (!cardNumber || !cardValid || !cardCvv)) {
      toast.error("Preencha todos os dados do cartão.");
      return;
    }
    if (paymentMethod === "pix" && !pixCopied) {
      toast.error("Copie o código PIX e confirme o pagamento antes de enviar o pedido.");
      return;
    }

    const valorCobrado = servicoSelecionado.precoBase[currentTipologia];
    const orderId = "SRV-" + Math.floor(1000 + Math.random() * 9000);
    const metodoFormatado =
      paymentMethod === "pix"
        ? "PIX Instantâneo"
        : paymentMethod === "cartao"
        ? `Cartão de Crédito (Final ${cardNumber.slice(-4) || "8821"})`
        : "Cartão de Crédito";

    const createdOrder = await addOrder({
      id: orderId,
      solicitante: "Ariane Soller",
      perfil: "Hóspede",
      categoria: "Serviços",
      imovel: unidade.toUpperCase().trim(),
      itens: `${servicoSelecionado.nome} (Padrão ${currentTipologia})`,
      valor: `R$ ${valorCobrado.toFixed(2).replace(".", ",")}`,
      status: "Em Preparação",
      metodo_pagamento: metodoFormatado,
      observacoes: servicoSelecionado.requerCodigo ? `Cód. Auth: ${codigoAutorizacao}` : "Solicitado via App",
    });

    await openMercadoPagoCheckout(createdOrder.id);
    return;
    setPaymentModalOpen(false);
    setSuccessModalOpen(true);
    setCodigoAutorizacao("");
    toast.success("Serviço solicitado com sucesso!");
  };

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/hospede/login"
      title="Serviços & Governança"
      subtitle="Solicite serviços adicionais com valores ajustados automaticamente para o padrão do seu imóvel."
    >
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        <div className="p-4 rounded-xl border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Valores calculados automaticamente de acordo com o padrão do seu imóvel (Código <strong>{currentTipologia}</strong>).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Unidade:</Label>
            <Input
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="w-24 h-8 text-xs font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SERVICOS.map((srv) => {
            const Icon = srv.icone;
            const preco = srv.precoBase[currentTipologia];
            return (
              <Card key={srv.id} className="border-border/80 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">
                        R$ {preco.toFixed(2).replace(".", ",")}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{srv.categoria}</p>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{srv.nome}</CardTitle>
                  <CardDescription className="text-xs">{srv.descricao}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {srv.requerCodigo && (
                    <div className="space-y-1">
                      <Label className="text-xs">Código de Autorização</Label>
                      <Input
                        placeholder="DIGITE O CÓDIGO"
                        value={codigoAutorizacao}
                        onChange={(e) => setCodigoAutorizacao(e.target.value)}
                        className="h-8 text-xs uppercase"
                      />
                    </div>
                  )}

                  <Button onClick={() => handleSolicitar(srv)} className="w-full gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4" /> Solicitar Serviço
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Pagamento do Serviço
            </DialogTitle>
            <DialogDescription className="text-xs">
              {servicoSelecionado?.nome} • Total: <strong>R$ {servicoSelecionado?.precoBase[currentTipologia].toFixed(2).replace(".", ",")}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === "pix" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/80"
                }`}
              >
                <QrCode className="h-4 w-4" /> PIX Instantâneo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cartao")}
                className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === "cartao" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/80"
                }`}
              >
                <CreditCard className="h-4 w-4" /> Cartão Online
              </button>
            </div>

            {paymentMethod === "pix" && (
              <div className="p-3.5 rounded-lg border bg-muted/40 space-y-2 text-center">
                <p className="text-xs font-semibold">Chave PIX Copia e Cola:</p>
                <code className="text-[11px] block bg-background p-2 rounded border break-all select-all font-mono">
                  00020126580014br.gov.bcb.pix0136zelo-servicos-pix-chave-aleatoria
                </code>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136zelo-servicos-pix-chave-aleatoria");
                  setPixCopied(true);
                  toast.success("Código PIX copiado!");
                  setTimeout(() => setPixCopied(false), 3000);
                }} className="w-full gap-1 text-xs cursor-pointer">
                  <Copy className="h-3 w-3" /> {pixCopied ? "Copiado!" : "Copiar Código PIX"}
                </Button>
              </div>
            )}

            {paymentMethod === "cartao" && (
              <div className="space-y-3 p-3.5 rounded-lg border bg-muted/40">
                <div className="space-y-1">
                  <Label className="text-xs">Número do Cartão</Label>
                  <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Validade</Label>
                    <Input placeholder="MM/AA" value={cardValid} onChange={(e) => setCardValid(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CVV</Label>
                    <Input placeholder="123" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleConfirmarPedido} className="w-full gap-2 cursor-pointer mt-2">
              <CheckCircle className="h-4 w-4" /> Confirmar e Solicitar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Sucesso */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md text-center py-6">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-base font-bold">Solicitação Enviada com Sucesso!</DialogTitle>
          <DialogDescription className="text-xs">
            Nossa equipe de governança foi notificada e realizará o serviço na sua acomodação.
          </DialogDescription>
          <DialogFooter className="mt-4">
            <Button onClick={() => setSuccessModalOpen(false)} className="w-full cursor-pointer">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
