import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, BedDouble, Save, Info } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/precos")({
  component: AdminPrecos,
});

const SERVICES_KEY = "zelo_services_amenities";
const CLEANING_KEY = "zelo_services_cleaning_prices";

export function AdminPrecos() {
  const [limpezaS, setLimpezaS] = useState("190");
  const [limpezaD, setLimpezaD] = useState("280");
  const [limpezaT, setLimpezaT] = useState("330");

  const [precoManta, setPrecoManta] = useState("25");
  const [precoAquecedor, setPrecoAquecedor] = useState("30");
  const [precoTravesseiro, setPrecoTravesseiro] = useState("15");

  const carregarPrecos = () => {
    const savedCleaning = localStorage.getItem(CLEANING_KEY);
    if (savedCleaning) {
      try {
        const c = JSON.parse(savedCleaning);
        setLimpezaS(String(c.S ?? 190));
        setLimpezaD(String(c.D ?? 280));
        setLimpezaT(String(c.T ?? 330));
      } catch {}
    }

    const savedAmenities = localStorage.getItem(SERVICES_KEY);
    if (savedAmenities) {
      try {
        const a = JSON.parse(savedAmenities);
        const manta = a.find((x: any) => x.id === "manta");
        if (manta) setPrecoManta(String(manta.price));

        const aquecedor = a.find((x: any) => x.id === "aquecedor");
        if (aquecedor) setPrecoAquecedor(String(aquecedor.price));

        const travesseiro = a.find((x: any) => x.id === "travesseiro");
        if (travesseiro) setPrecoTravesseiro(String(travesseiro.price));
      } catch {}
    }
  };

  useEffect(() => {
    carregarPrecos();
  }, []);

  const handleSalvar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const novasTaxas = {
      S: Number(limpezaS.replace(",", ".")) || 190,
      D: Number(limpezaD.replace(",", ".")) || 280,
      T: Number(limpezaT.replace(",", ".")) || 330,
    };

    const novasComodidades = [
      {
        id: "manta",
        name: "Aluguel de Manta de Microfibra Extra",
        category: "Conforto & Enxoval",
        price: Number(precoManta.replace(",", ".")) || 25,
        description: "Manta de microfibra de qualidade para conforto adicional.",
        requiresAuth: true,
        showWhatsApp: true,
      },
      {
        id: "aquecedor",
        name: "Aluguel de Mini Aquecedores Portáteis",
        category: "Climatização",
        price: Number(precoAquecedor.replace(",", ".")) || 30,
        description: "Mini aquecedor portátil de segurança.",
        requiresAuth: true,
        showWhatsApp: true,
      },
      {
        id: "travesseiro",
        name: "Aluguel de Travesseiros Extras",
        category: "Conforto & Enxoval",
        price: Number(precoTravesseiro.replace(",", ".")) || 15,
        description: "Travesseiro extra de qualidade.",
        requiresAuth: true,
        showWhatsApp: true,
      },
    ];

    localStorage.setItem(CLEANING_KEY, JSON.stringify(novasTaxas));
    localStorage.setItem(SERVICES_KEY, JSON.stringify(novasComodidades));
    window.dispatchEvent(new Event("zelo_services_updated"));

    toast.success("Tabela de preços atualizada com sucesso em tempo real!");
  };

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Tabela de Preços & Regras"
      subtitle="Defina os valores automáticos aplicados às tipologias de imóveis (S, D, T) e comodidades extras da Zelo."
    >
      <form onSubmit={handleSalvar} className="space-y-6 max-w-4xl text-left">
        <div className="flex items-center gap-2 p-3.5 bg-secondary/80 rounded-xl text-xs text-muted-foreground border">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            Os valores alterados e salvos aqui refletem imediatamente para todos os hóspedes e proprietários.
          </span>
        </div>

        {/* Limpeza por Categoria (S, D, T) */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Taxas de Limpeza Adicional</CardTitle>
            </div>
            <CardDescription>
              Cálculo automático baseado no prefixo do código do imóvel (S, D, T).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Código S (Estúdio)</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={limpezaS}
                  onChange={(e) => setLimpezaS(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código D (2 Quartos)</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={limpezaD}
                  onChange={(e) => setLimpezaD(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código T (3 Quartos)</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={limpezaT}
                  onChange={(e) => setLimpezaT(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comodidades Extras */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Aluguel de Itens de Comodidade</CardTitle>
            </div>
            <CardDescription>
              Valores unitários cobrados pela locação de comodidades adicionais durante a estadia.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Manta de Microfibra Extra</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={precoManta}
                  onChange={(e) => setPrecoManta(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mini Aquecedor Portátil</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={precoAquecedor}
                  onChange={(e) => setPrecoAquecedor(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Travesseiros Extras</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={precoTravesseiro}
                  onChange={(e) => setPrecoTravesseiro(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="gap-2 px-6 cursor-pointer">
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </form>
    </DashboardShell>
  );
}