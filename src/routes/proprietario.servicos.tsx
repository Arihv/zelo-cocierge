import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Flame, BedDouble, PlusCircle, Check, Info, Lock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/proprietario/servicos")({
  component: ProprietarioServicos,
});

const WHATSAPP_LINK = "https://wa.me/5548991654462";

const CLEANING_PRICES: Record<string, number> = {
  S: 190.0,
  D: 280.0,
  T: 330.0,
};

export function ProprietarioServicos() {
  const { user } = useAuth();
  const [solicitados, setSolicitados] = useState<string[]>([]);
  const [authCodes, setAuthCodes] = useState<Record<string, string>>({});

  const handleCodeChange = (serviceId: string, value: string) => {
    setAuthCodes((prev) => ({
      ...prev,
      [serviceId]: value.toUpperCase().trim(),
    }));
  };

  const getDynamicCleaningPrice = (code: string | undefined): number | null => {
    if (!code || code.length < 2) return null;
    const prefix = code.charAt(0).toUpperCase();
    return CLEANING_PRICES[prefix] ?? null;
  };

  const servicos = [
    {
      id: "manta",
      nome: "Aluguel de Manta de Microfibra Extra",
      categoria: "Conforto & Enxoval",
      precoBase: 25.0,
      descricao: "Manta de microfibra de qualidade para conforto adicional dos seus hóspedes.",
      icon: BedDouble,
      requiresAuth: true,
      showWhatsApp: true,
    },
    {
      id: "aquecedor",
      nome: "Aluguel de Mini Aquecedores Portáteis",
      categoria: "Climatização",
      precoBase: 30.0,
      descricao: "Mini aquecedor portátil de segurança para o imóvel.",
      icon: Flame,
      requiresAuth: true,
      showWhatsApp: true,
      destaque: true,
    },
    {
      id: "travesseiro",
      nome: "Aluguel de Travesseiros Extras",
      categoria: "Conforto & Enxoval",
      precoBase: 15.0,
      descricao: "Travesseiro extra de qualidade padrão hotelaria.",
      icon: BedDouble,
      requiresAuth: true,
      showWhatsApp: true,
    },
    {
      id: "limpeza-extra",
      nome: "Limpeza Profissional / Extra",
      categoria: "Higienização",
      descricao: "Higienização completa entre estadias identificada automaticamente pela tipologia (S, D, T).",
      icon: Sparkles,
      isCleaningDynamic: true,
      requiresAuth: true,
      showWhatsApp: false,
    },
  ];

  const handleSolicitar = (servico: any) => {
    const isSelected = solicitados.includes(servico.id);

    if (isSelected) {
      setSolicitados(solicitados.filter((item) => item !== servico.id));
      toast.info(`Item "${servico.nome}" removido da solicitação.`);
      return;
    }

    const code = authCodes[servico.id] || "";
    let finalValor = servico.precoBase;

    if (servico.isCleaningDynamic) {
      finalValor = getDynamicCleaningPrice(code);
      if (!finalValor) {
        toast.error("Informe um código de limpeza válido (ex: S2207, D2207, T2207)");
        return;
      }
    } else if (servico.requiresAuth && code.length < 2) {
      toast.error("Informe o código da propriedade/autorização.");
      return;
    }

    setSolicitados([...solicitados, servico.id]);

    // Registra o pedido no histórico para a Operação da Zelo
    const novoPedido = {
      id: "PED-" + Math.floor(1000 + Math.random() * 9000),
      solicitante: user?.email?.split("@")[0] || "Proprietário",
      perfil: "Proprietário",
      imovel: code || "Imóvel",
      categoria: "Serviços",
      itens: `${servico.nome} (Cód: ${code || "N/A"})`,
      valor: `R$ ${finalValor.toFixed(2).replace(".", ",")}`,
      data: new Date().toLocaleDateString("pt-BR"),
      status: "Recebido",
    };

    const historicoAtual = JSON.parse(localStorage.getItem("estadia_historico_pedidos") || "[]");
    localStorage.setItem("estadia_historico_pedidos", JSON.stringify([novoPedido, ...historicoAtual]));

    toast.success(`"${servico.nome}" solicitado com sucesso! Acompanhe em Solicitações.`);
  };

  return (
    <DashboardShell
      nav={ownerNav}
      role="Proprietário"
      logoutTo="/proprietario/login"
      title="Serviços Sob Demanda"
      subtitle="Contrate facilidades, reposição de enxoval e limpezas para suas propriedades."
    >
      <div className="space-y-6">
        {/* Informativo Geral */}
        <div className="flex items-center gap-2 p-3.5 bg-secondary/80 rounded-xl text-xs text-muted-foreground border">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            Informe o código da sua unidade para calcular automaticamente o valor das limpezas e validar a solicitação de itens.
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {servicos.map((servico) => {
            const isSelected = solicitados.includes(servico.id);
            const currentCode = authCodes[servico.id] || "";
            const dynamicPrice = servico.isCleaningDynamic
              ? getDynamicCleaningPrice(currentCode)
              : servico.precoBase;

            const isButtonDisabled = servico.isCleaningDynamic
              ? dynamicPrice === null
              : servico.requiresAuth && currentCode.length < 2;

            const Icon = servico.icon;

            return (
              <Card
                key={servico.id}
                className={`flex flex-col justify-between transition-all ${
                  servico.destaque ? "border-primary/50 shadow-sm" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      {servico.isCleaningDynamic && dynamicPrice === null ? (
                        <span className="text-xs text-muted-foreground italic">
                          Informe o código para ver o preço
                        </span>
                      ) : (
                        <span className="text-base font-bold text-foreground">
                          R$ {dynamicPrice?.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-lg text-left">{servico.nome}</CardTitle>
                  <CardDescription className="text-left">{servico.categoria}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-left">{servico.descricao}</p>

                  {/* Aviso do WhatsApp para itens de aluguel */}
                  {servico.showWhatsApp && (
                    <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3 flex items-start gap-2 text-xs text-sky-900 dark:text-sky-200 text-left">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
                      <span>
                        Entrar em contato pelo{" "}
                        <a
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline hover:text-sky-700 inline-flex items-center gap-0.5"
                        >
                          WhatsApp <MessageCircle className="h-3 w-3 inline" />
                        </a>{" "}
                        para verificar disponibilidade.
                      </span>
                    </div>
                  )}

                  {/* Campo de Código de Autorização */}
                  {servico.requiresAuth && (
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Código da Propriedade / Autorização
                      </label>
                      <Input
                        type="text"
                        placeholder=""
                        value={currentCode}
                        onChange={(e) => handleCodeChange(servico.id, e.target.value)}
                        className="h-10 uppercase tracking-widest font-mono text-xs"
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => handleSolicitar(servico)}
                    disabled={isButtonDisabled && !isSelected}
                    variant={isSelected ? "secondary" : "default"}
                    className="w-full justify-center gap-2 cursor-pointer"
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" /> Solicitado
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" /> Solicitar Serviço
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
