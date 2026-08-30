import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/proprietario/parcerias")({
  component: ProprietarioParcerias,
});

interface PartnerItem {
  id: string;
  empresa: string;
  categoria: string;
  desconto: string;
  descricao: string;
}

const STORAGE_KEY = "zelo_parcerias_data";

export function ProprietarioParcerias() {
  const [parcerias, setParcerias] = useState<PartnerItem[]>([]);

  const carregarParcerias = () => {
    const salvos = localStorage.getItem(STORAGE_KEY);
    if (salvos !== null) {
      try {
        setParcerias(JSON.parse(salvos));
      } catch {
        setParcerias([]);
      }
    } else {
      setParcerias([]);
    }
  };

  useEffect(() => {
    carregarParcerias();

    const handleSync = () => carregarParcerias();
    window.addEventListener("storage", handleSync);
    window.addEventListener("zelo_parcerias_updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("zelo_parcerias_updated", handleSync);
    };
  }, []);

  return (
    <DashboardShell
      nav={ownerNav}
      role="Proprietário"
      logoutTo="/proprietario/login"
      title="Parcerias"
      subtitle="Vantagens e descontos exclusivos para proprietários parceiros."
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-3.5 bg-secondary/80 rounded-xl text-xs text-muted-foreground border text-left">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            Benefícios e convênios negociados pela Zelo para manutenção, enxoval e serviços nas suas unidades.
          </span>
        </div>

        {parcerias.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            Nenhuma parceria disponível no momento. Novas vantagens serão adicionadas em breve pela equipe Zelo.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parcerias.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between text-left border-border/80 hover:border-primary/40 transition-all shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Handshake className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      {item.desconto}
                    </span>
                  </div>
                  <CardTitle className="mt-4 text-xl">{item.empresa}</CardTitle>
                  <CardDescription>{item.categoria}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.descricao}</p>
                  <Button variant="outline" className="w-full justify-between cursor-pointer">
                    Acessar benefício <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}