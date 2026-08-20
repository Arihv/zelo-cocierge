import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { QrCode, CreditCard, CheckCircle, Clock, Copy, UtensilsCrossed, Coffee } from "lucide-react";
import { toast } from "sonner";
import { useOrdersStore } from "@/hooks/use-orders-store";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";

export const Route = createFileRoute("/hospede/kits")({
  component: HospedeKitsPage,
});

interface KitItem {
  id: string;
  category: "cafe" | "refeicao";
  categoryLabel: string;
  name: string;
  portion: string;
  price: number;
  items: string[];
}

const KITS: KitItem[] = [
  {
    id: "kit-cafe-1",
    category: "cafe",
    categoryLabel: "Kit Café da Manhã",
    name: "Kit Individual",
    portion: "1 pessoa",
    price: 49.90,
    items: ["Pão", "Café", "Açúcar", "Manteiga", "Ovos"],
  },
  {
    id: "kit-cafe-2",
    category: "cafe",
    categoryLabel: "Kit Café da Manhã",
    name: "Kit Casal",
    portion: "2 pessoas",
    price: 89.90,
    items: ["Pão (dobrado)", "Café", "Açúcar", "Manteiga", "Ovos", "Queijo"],
  },
  {
    id: "kit-cafe-3",
    category: "cafe",
    categoryLabel: "Kit Café da Manhã",
    name: "Kit Família",
    portion: "4 pessoas",
    price: 159.90,
    items: ["Pão (4x)", "Café", "Açúcar", "Manteiga", "Ovos (12)", "Queijo", "Presunto"],
  },
  {
    id: "kit-refeicao-1",
    category: "refeicao",
    categoryLabel: "Kit Refeição",
    name: "Kit Refeição Básico",
    portion: "1 a 2 pessoas",
    price: 59.90,
    items: ["Macarrão", "Molho bolonhesa", "Queijo ralado"],
  },
  {
    id: "kit-refeicao-2",
    category: "refeicao",
    categoryLabel: "Kit Refeição",
    name: "Kit Refeição Completo",
    portion: "2 a 3 pessoas",
    price: 74.00,
    items: ["Macarrão", "Molho bolonhesa", "Queijo ralado", "Bebida"],
  },
];

export function HospedeKitsPage() {
  const { addOrder } = useOrdersStore();

  const [selectedKitId, setSelectedKitId] = useState<string>("kit-cafe-2");
  const [nome, setNome] = useState("Ariane Soller");
  const [apartamento, setApartamento] = useState("S-102");
  const [observacoes, setObservacoes] = useState("");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardValid, setCardValid] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const selectedKit = KITS.find((k) => k.id === selectedKitId) || KITS[0];

  const handleOpenPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === "cartao" && (!cardNumber || !cardValid || !cardCvv)) {
      toast.error("Por favor, preencha os dados do cartão.");
      return;
    }
    if (paymentMethod === "pix" && !pixCopied) {
      toast.error("Copie o código PIX e confirme o pagamento antes de enviar o pedido.");
      return;
    }

    const orderId = "KIT-" + Math.floor(1000 + Math.random() * 9000);
    const metodoFormatado =
      paymentMethod === "pix"
        ? "PIX Instantâneo"
        : paymentMethod === "cartao"
        ? `Cartão de Crédito (Final ${cardNumber.slice(-4) || "8821"})`
        : "Cartão de Crédito";

    const createdOrder = await addOrder({
      id: orderId,
      solicitante: nome || "Ariane Soller",
      perfil: "Hóspede",
      categoria: "Kits",
      imovel: (apartamento || "S-102").toUpperCase().trim(),
      itens: `1x ${selectedKit.name} (${selectedKit.categoryLabel})`,
      valor: `R$ ${selectedKit.price.toFixed(2).replace(".", ",")}`,
      status: "Em Preparação",
      metodo_pagamento: metodoFormatado,
      observacoes: observacoes || "Sem observações",
    });

    await openMercadoPagoCheckout(createdOrder.id);
    return;
    setPaymentModalOpen(false);
    setSuccessModalOpen(true);
    toast.success("Pedido de Kit confirmado com sucesso!");
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136zelo-kits-pix-chave-aleatoria");
    setPixCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setPixCopied(false), 3000);
  };

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/hospede/login"
      title="Kits de Café da Manhã & Refeição"
      subtitle="Solicite kits sob medida para sua estadia com entrega direta na sua unidade."
    >
      <div className="grid gap-6 lg:grid-cols-3 text-left max-w-6xl mx-auto">
        {/* Lista de Kits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Café da manhã */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Kit Café da Manhã</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {KITS.filter((k) => k.category === "cafe").map((kit) => {
                const isSelected = selectedKitId === kit.id;
                return (
                  <div
                    key={kit.id}
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                        : "border-border/80 bg-card/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{kit.name}</h3>
                        <p className="text-xs text-muted-foreground">{kit.portion}</p>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      {kit.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>

                    <div className="mt-4 pt-2 border-t flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Entrega no apto</Badge>
                      <span className="font-bold text-sm text-foreground">
                        R$ {kit.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refeição */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Kit Refeição</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {KITS.filter((k) => k.category === "refeicao").map((kit) => {
                const isSelected = selectedKitId === kit.id;
                return (
                  <div
                    key={kit.id}
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                        : "border-border/80 bg-card/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{kit.name}</h3>
                        <p className="text-xs text-muted-foreground">{kit.portion}</p>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      {kit.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>

                    <div className="mt-4 pt-2 border-t flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">Entrega no apto</Badge>
                      <span className="font-bold text-sm text-foreground">
                        R$ {kit.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Formulário Lateral */}
        <div>
          <Card className="border-border/80 shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes da Entrega</CardTitle>
              <CardDescription className="text-xs">
                Confirme suas informações e finalize a solicitação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOpenPayment} className="space-y-4 text-left">
                <div className="space-y-1">
                  <Label className="text-xs">Hóspede</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Código do Apartamento</Label>
                  <Input value={apartamento} onChange={(e) => setApartamento(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Observações / Restrições (Opcional)</Label>
                  <Textarea
                    placeholder="Ex: Sem lactose, preferência de horário..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Selecionado:</span>
                    <span className="font-semibold text-foreground">{selectedKit.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Total:</span>
                    <span className="text-primary text-base">
                      R$ {selectedKit.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2 cursor-pointer">
                  <UtensilsCrossed className="h-4 w-4" /> Solicitar Kit
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" /> Pagamento do Kit
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedKit.name} • Total: <strong>R$ {selectedKit.price.toFixed(2).replace(".", ",")}</strong>
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
                <p className="text-xs font-semibold text-foreground">Chave PIX Copia e Cola:</p>
                <code className="text-[11px] block bg-background p-2 rounded border break-all select-all font-mono">
                  00020126580014br.gov.bcb.pix0136zelo-kits-pix-chave-aleatoria
                </code>
                <Button size="sm" variant="outline" onClick={copyPixCode} className="w-full gap-1 text-xs cursor-pointer">
                  <Copy className="h-3 w-3" /> {pixCopied ? "Copiado!" : "Copiar Código PIX"}
                </Button>
              </div>
            )}

            {paymentMethod === "cartao" && (
              <div className="space-y-3 p-3.5 rounded-lg border bg-muted/40">
                <div className="space-y-1">
                  <Label className="text-xs">Número do Cartão de Crédito</Label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Validade</Label>
                    <Input
                      placeholder="MM/AA"
                      value={cardValid}
                      onChange={(e) => setCardValid(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CVV</Label>
                    <Input
                      placeholder="123"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleConfirmOrder} className="w-full gap-2 cursor-pointer mt-2">
              <CheckCircle className="h-4 w-4" /> Confirmar e Enviar Pedido
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
          <DialogTitle className="text-base font-bold">Kit Solicitado com Sucesso!</DialogTitle>
          <DialogDescription className="text-xs">
            A equipe da Zelo já recebeu seu pedido e iniciará a preparação para sua unidade.
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
