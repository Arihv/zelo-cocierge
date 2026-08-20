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
import { ShoppingCart, Plus, Minus, Search, CheckCircle, QrCode, CreditCard, Copy, Trash2 } from "lucide-react";
import { useMarketStore, MarketProduct } from "@/hooks/use-market-store";
import { useOrdersStore } from "@/hooks/use-orders-store";
import { openMercadoPagoCheckout } from "@/lib/mercado-pago";
import { toast } from "sonner";

export const Route = createFileRoute("/hospede/mercado")({
  component: HospedeMercadoPage,
});

export function HospedeMercadoPage() {
  const { products, categories, minOrder, updateProductStock } = useMarketStore();
  const { addOrder } = useOrdersStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [nome, setNome] = useState("Ariane Soller");
  const [apartamento, setApartamento] = useState("S-102");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardValid, setCardValid] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "Todas" || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (product: MarketProduct) => {
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.stock) {
      toast.error(`Estoque máximo atingido para ${product.name}`);
      return;
    }
    setCart((prev) => ({ ...prev, [product.id]: currentQty + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const totalCart = Object.entries(cart).reduce((acc, [id, qty]) => {
    const prod = products.find((p) => p.id === id);
    return acc + (prod ? prod.price * qty : 0);
  }, 0);

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleOpenCheckout = () => {
    if (totalCart < minOrder) {
      toast.error(`O pedido mínimo do mercado é de R$ ${minOrder.toFixed(2).replace(".", ",")}`);
      return;
    }
    setPaymentModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === "cartao" && (!cardNumber || !cardValid || !cardCvv)) {
      toast.error("Preencha todos os dados do cartão.");
      return;
    }
    if (paymentMethod === "pix" && !pixCopied) {
      toast.error("Copie o código PIX e confirme o pagamento antes de enviar o pedido.");
      return;
    }

    const itensDescricao = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((prod) => prod.id === id);
        return `${qty}x ${p?.name || "Item"}`;
      })
      .join(", ");

    const orderId = "MKT-" + Math.floor(1000 + Math.random() * 9000);
    const metodoFormatado =
      paymentMethod === "pix"
        ? "PIX Instantâneo"
        : paymentMethod === "cartao"
        ? `Cartão de Crédito (Final ${cardNumber.slice(-4) || "8821"})`
        : "Cartão de Crédito";

    // 1. Grava no banco em nuvem
    const createdOrder = await addOrder({
      id: orderId,
      solicitante: nome || "Ariane Soller",
      perfil: "Hóspede",
      categoria: "Minimercado",
      imovel: (apartamento || "S-102").toUpperCase().trim(),
      itens: itensDescricao,
      valor: `R$ ${totalCart.toFixed(2).replace(".", ",")}`,
      status: "Em Preparação",
      metodo_pagamento: metodoFormatado,
      observacoes: "Pedido de conveniência do Minimercado",
    });

    await openMercadoPagoCheckout(createdOrder.id);
    return;

    // 2. Abate do estoque do Supabase
    for (const [id, qty] of Object.entries(cart)) {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        await updateProductStock(id, Math.max(0, prod.stock - qty));
      }
    }

    setPaymentModalOpen(false);
    setSuccessModalOpen(true);
    setCart({});
    toast.success("Pedido de mercado confirmado com sucesso!");
  };

  return (
    <DashboardShell
      nav={guestNav}
      role="Hóspede"
      logoutTo="/hospede/login"
      title="Minimercado de Conveniência"
      subtitle={`Itens essenciais entregues no seu apartamento. Pedido mínimo: R$ ${minOrder.toFixed(2).replace(".", ",")}`}
    >
      <div className="grid gap-6 lg:grid-cols-3 text-left max-w-6xl mx-auto">
        {/* Catálogo de Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar itens no mercado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filtro de Categorias */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {["Todas", ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Produtos */}
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredProducts.map((p) => {
              const qtyInCart = cart[p.id] || 0;
              const hasStock = p.stock > 0;
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border bg-card/60 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {p.category}
                      </span>
                      <h4 className="font-semibold text-sm text-foreground">{p.name}</h4>
                    </div>
                    <Badge variant={hasStock ? "outline" : "destructive"} className="text-[10px] shrink-0">
                      {hasStock ? `${p.stock} un` : "Esgotado"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold text-sm text-foreground">
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </span>

                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => removeFromCart(p.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-4 text-center">{qtyInCart}</span>
                        <Button
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => addToCart(p)}
                          disabled={qtyInCart >= p.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!hasStock}
                        onClick={() => addToCart(p)}
                        className="h-8 gap-1 text-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrinho Lateral */}
        <div>
          <Card className="border-border/80 shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Carrinho ({totalItemsCount})</span>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription className="text-xs">
                Itens selecionados para entrega no seu quarto.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {Object.keys(cart).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Seu carrinho está vazio.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(cart).map(([id, qty]) => {
                    const prod = products.find((p) => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={id} className="flex items-center justify-between text-xs border-b pb-2">
                        <div className="pr-2">
                          <p className="font-semibold text-foreground">{prod.name}</p>
                          <p className="text-muted-foreground">
                            {qty}x R$ {prod.price.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <span className="font-bold text-foreground">
                          R$ {(prod.price * qty).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Hóspede</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Apartamento</Label>
                <Input value={apartamento} onChange={(e) => setApartamento(e.target.value)} required />
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total do Pedido:</span>
                  <span className="text-primary text-base">
                    R$ {totalCart.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleOpenCheckout}
                disabled={totalItemsCount === 0}
                className="w-full gap-2 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" /> Finalizar Compra
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md text-left">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Pagamento do Mercado
            </DialogTitle>
            <DialogDescription className="text-xs">
              Total da compra: <strong>R$ {totalCart.toFixed(2).replace(".", ",")}</strong>
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
                  00020126580014br.gov.bcb.pix0136zelo-mercado-pix-chave-aleatoria
                </code>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136zelo-mercado-pix-chave-aleatoria");
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
          <DialogTitle className="text-base font-bold">Pedido Realizado com Sucesso!</DialogTitle>
          <DialogDescription className="text-xs">
            Seus itens foram separados e estão a caminho do seu quarto.
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
