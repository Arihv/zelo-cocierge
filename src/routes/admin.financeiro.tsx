import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  QrCode, 
  Building, 
  Save, 
  Lock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck 
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/financeiro")({
  component: AdminFinanceiro,
});

export function AdminFinanceiro() {
  const [config, setConfig] = useState({
    gateway: "mercadopago", // mercadopago | asaas | stripe | pix_direto
    chavePix: "contato@estadia.com",
    tipoChave: "E-mail",
    titularNome: "Estadia Gestão de Hospedagem LTDA",
    cnpjCpf: "12.345.678/0001-90",
    bancoNome: "Banco Inter / Nubank",
    accessToken: "",
    publicKey: "",
  });

  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    // 1. Carrega dados de configuração financeira
    const salvos = localStorage.getItem("estadia_gateway_config");
    if (salvos) {
      setConfig(JSON.parse(salvos));
    }

    // 2. Carrega histórico de pedidos para calcular entradas
    const pedidosSalvos = localStorage.getItem("estadia_historico_pedidos");
    if (pedidosSalvos) {
      setPedidos(JSON.parse(pedidosSalvos));
    }
  }, []);

  const totalRecebido = pedidos.reduce((acc, p) => {
    const num = parseFloat(
      String(p.valor || "0")
        .replace("R$", "")
        .replace(".", "")
        .replace(",", ".")
        .trim()
    );
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("estadia_gateway_config", JSON.stringify(config));
    toast.success("Configurações de recebimento e conta bancária salvas com sucesso!");
  };

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Financeiro & Dados de Recebimento"
      subtitle="Defina onde o dinheiro das vendas cairá e acompanhe as entradas da plataforma."
    >
      <div className="space-y-6 max-w-5xl">
        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faturamento Bruto</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total acumulado de pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destino Ativo</span>
              <Building className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold truncate">{config.titularNome}</div>
              <p className="text-xs text-muted-foreground mt-1">{config.bancoNome} • {config.tipoChave}: {config.chavePix}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status do Gateway</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-foreground capitalize">
                  {config.gateway === "pix_direto" ? "PIX Direto" : config.gateway} Ativo
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pronto para receber transações</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas: Configuração da Conta vs Extrato de Entradas */}
        <Tabs defaultValue="conta" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="conta" className="gap-2">
              <Building className="h-4 w-4" /> Conta de Recebimento
            </TabsTrigger>
            <TabsTrigger value="extrato" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Extrato de Pedidos ({pedidos.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba: Formulário de Configuração Bancária */}
          <TabsContent value="conta">
            <form onSubmit={handleSalvar} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Qual meio você deseja usar para receber os pagamentos?</CardTitle>
                  <CardDescription>Escolha se quer receber via chave PIX direta da sua empresa ou gateway automático.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, gateway: "pix_direto" })}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        config.gateway === "pix_direto" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-border"
                      }`}
                    >
                      <QrCode className="h-5 w-5 text-primary mb-2" />
                      <div className="font-bold text-sm">PIX Direto na Conta</div>
                      <p className="text-xs text-muted-foreground mt-1">Cai direto na sua conta bancária sem intermediários.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, gateway: "mercadopago" })}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        config.gateway === "mercadopago" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-border"
                      }`}
                    >
                      <Building className="h-5 w-5 text-primary mb-2" />
                      <div className="font-bold text-sm">Mercado Pago</div>
                      <p className="text-xs text-muted-foreground mt-1">PIX automático e Cartão de Crédito até 6x.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, gateway: "asaas" })}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        config.gateway === "asaas" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-border"
                      }`}
                    >
                      <Building className="h-5 w-5 text-primary mb-2" />
                      <div className="font-bold text-sm">Asaas / EFI</div>
                      <p className="text-xs text-muted-foreground mt-1">Especializado em cobranças e split com proprietários.</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Dados Bancários da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados da Conta Bancária / Titular</CardTitle>
                  <CardDescription>Estes dados identificam quem receberá os valores transferidos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nome do Titular ou Razão Social</Label>
                      <Input
                        value={config.titularNome}
                        onChange={(e) => setConfig({ ...config, titularNome: e.target.value })}
                        required
                        placeholder="Ex: Minha Empresa Hospedagens LTDA"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>CNPJ ou CPF do Titular</Label>
                      <Input
                        value={config.cnpjCpf}
                        onChange={(e) => setConfig({ ...config, cnpjCpf: e.target.value })}
                        required
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Tipo de Chave PIX</Label>
                      <select
                        value={config.tipoChave}
                        onChange={(e) => setConfig({ ...config, tipoChave: e.target.value })}
                        className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                      >
                        <option value="CNPJ/CPF">CNPJ / CPF</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Telefone">Telefone</option>
                        <option value="Chave Aleatória">Chave Aleatória</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Chave PIX para Depósito</Label>
                      <Input
                        value={config.chavePix}
                        onChange={(e) => setConfig({ ...config, chavePix: e.target.value })}
                        required
                        placeholder="sua-chave-pix@aqui.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Banco / Instituição</Label>
                    <Input
                      value={config.bancoNome}
                      onChange={(e) => setConfig({ ...config, bancoNome: e.target.value })}
                      placeholder="Ex: Nubank, Inter, Itaú, Bradesco"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Chaves de API do Gateway (Opcional) */}
              {config.gateway !== "pix_direto" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Credenciais de API ({config.gateway})</CardTitle>
                    <CardDescription>Insira as chaves fornecidas no painel do seu gateway de pagamento.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Access Token (Secret Key)</Label>
                      <Input
                        type="password"
                        value={config.accessToken}
                        onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                        placeholder="APP_USR-..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Public Key</Label>
                      <Input
                        value={config.publicKey}
                        onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                        placeholder="APP_USR-..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="gap-2 px-6">
                <Save className="h-4 w-4" /> Salvar Configurações Financeiras
              </Button>
            </form>
          </TabsContent>

          {/* Aba: Extrato de Transações */}
          <TabsContent value="extrato">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entradas & Pedidos Registrados</CardTitle>
                <CardDescription>Fluxo de valores processados de hóspedes e proprietários.</CardDescription>
              </CardHeader>
              <CardContent>
                {pedidos.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum pedido processado até o momento.
                  </div>
                ) : (
                  <div className="divide-y text-sm">
                    {pedidos.map((p) => (
                      <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {p.id}
                            </span>
                            <span className="font-semibold text-foreground">{p.solicitante} ({p.perfil})</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.categoria}: {p.itens} • Imóvel: {p.imovel}</p>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-600 block">{p.valor}</span>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}