import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/parcerias")({
  component: AdminParcerias,
});

export interface PartnerItem {
  id: string;
  empresa: string;
  categoria: string;
  desconto: string;
  descricao: string;
}

const STORAGE_KEY = "zelo_parcerias_data";

export function AdminParcerias() {
  const [parcerias, setParcerias] = useState<PartnerItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [empresa, setEmpresa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [desconto, setDesconto] = useState("");
  const [descricao, setDescricao] = useState("");

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

  const salvarEPropagar = (novasParcerias: PartnerItem[]) => {
    setParcerias(novasParcerias);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasParcerias));
    window.dispatchEvent(new Event("zelo_parcerias_updated"));
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo: PartnerItem = {
      id: "parc-" + Date.now(),
      empresa,
      categoria,
      desconto,
      descricao,
    };
    const atualizados = [...parcerias, novo];
    salvarEPropagar(atualizados);
    toast.success("Parceria cadastrada com sucesso!");
    setModalOpen(false);
    setEmpresa("");
    setCategoria("");
    setDesconto("");
    setDescricao("");
  };

  const handleExcluir = (id: string) => {
    const filtrados = parcerias.filter((p) => p.id !== id);
    salvarEPropagar(filtrados);
    toast.success("Parceria removida.");
  };

  return (
    <DashboardShell
      nav={adminNav}
      role="Administrador"
      logoutTo="/admin/login"
      title="Gestão de Parcerias"
      subtitle="Cadastre empresas parceiras e benefícios exibidos na área dos proprietários."
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Parcerias Ativas ({parcerias.length})</h2>
            <p className="text-xs text-muted-foreground">Disponíveis no painel de benefícios dos proprietários</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Nova Parceria
          </Button>
        </div>

        {parcerias.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            Nenhuma parceria cadastrada. Clique em "Nova Parceria" para adicionar.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {parcerias.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between text-left border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                      <Tag className="h-3 w-3" /> {p.desconto}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base">{p.empresa}</CardTitle>
                  <CardDescription>{p.descricao}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0 flex justify-end border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluir(p.id)}
                    className="gap-1 h-8 text-xs text-destructive hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Nova Parceria */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Empresa Parceira</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCadastrar} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label>Nome da Empresa</Label>
                <Input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  required
                  placeholder="Ex: Lavanderia Prime"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                    placeholder="Ex: Limpeza / Manutenção"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Benefício / Desconto</Label>
                  <Input
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    required
                    placeholder="Ex: 20% OFF"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição do Benefício</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  placeholder="Detalhes de como o proprietário aproveita o desconto"
                />
              </div>

              <Button type="submit" className="w-full cursor-pointer">
                Cadastrar Parceria
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}