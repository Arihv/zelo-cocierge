import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ownerNav } from "@/lib/nav";
import { useMarketStore } from "@/hooks/use-market-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  XCircle
} from "lucide-react";

export const Route = createFileRoute("/proprietario/mercado")({
  component: ProprietarioMercadoPage,
});

const brl = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

export function ProprietarioMercadoPage() {
  const { products, categories } = useMarketStore();
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [busca, setBusca] = useState("");

  const produtosFiltrados = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoriaAtiva === "Todas" || p.category === categoriaAtiva;
      const matchBusca = p.name.toLowerCase().includes(busca.toLowerCase());
      return matchCat && matchBusca;
    });
  }, [products, categoriaAtiva, busca]);

  const totalUnidades = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [products]);

  return (
    <DashboardShell
      nav={ownerNav}
      role="Proprietário"
      logoutTo="/proprietario/login"
      title="Estoque do Minimercado"
      subtitle="Acompanhe em tempo real a disponibilidade de itens e conveniências abastecidos pela Zelo."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Painel Informativo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex items-center gap-3.5 border-border/80 bg-card p-5 text-left shadow-sm">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Itens no Catálogo</div>
              <div className="font-serif text-xl font-bold text-foreground">{products.length} produtos</div>
            </div>
          </Card>

          <Card className="flex items-center gap-3.5 border-border/80 bg-card p-5 text-left shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Volume Físico em Estoque</div>
              <div className="font-serif text-xl font-bold text-foreground">{totalUnidades} unidades</div>
            </div>
          </Card>

          <div className="flex items-center gap-2 rounded-xl border bg-secondary/80 p-5 text-left text-xs text-muted-foreground sm:col-span-2 lg:col-span-1">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              Visão somente leitura. O abastecimento e a contagem são gerenciados pela equipe Zelo.
            </span>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-border/80 shadow-sm"><div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar item no catálogo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto scrollbar-none">
            {["Todas", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoriaAtiva(c)}
                className={`cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  categoriaAtiva === c
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div></Card>

        {/* Grid de Itens */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtosFiltrados.map((p) => {
            const isZero = p.stock === 0;
            const isLow = p.stock > 0 && p.stock <= 5;

            return (
              <Card 
                key={p.id} 
                className="flex flex-col justify-between gap-4 border-border/80 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-primary tracking-wider block">
                    {p.category}
                  </span>
                  <h4 className="text-sm font-semibold leading-snug text-foreground">{p.name}</h4>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">Valor</span>
                    <span className="font-serif text-base font-bold text-foreground">
                      {brl(p.price)}
                    </span>
                  </div>

                  {/* Status do Estoque */}
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                    isZero
                      ? "bg-stone-500/10 text-stone-500 border-stone-500/20"
                      : isLow
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  }`}>
                    {isZero ? (
                      <>
                        <XCircle className="h-3 w-3" />
                        <span>Esgotado</span>
                      </>
                    ) : isLow ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        <span>{p.stock} un (Baixo)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{p.stock} un</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </DashboardShell>
  );
}
