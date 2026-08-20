import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/servicos")({
  component: AdminServicosPage,
});

interface ServiceAdminItem {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  requiresAuthCode: boolean;
  showWhatsAppWarning: boolean;
  isCleaningDynamic?: boolean;
}

const DEFAULT_ADMIN_SERVICES: ServiceAdminItem[] = [
  {
    id: "manta-microfibra",
    title: "Aluguel de Manta de Microfibra Extra",
    description: "Manta de microfibra de qualidade para conforto adicional",
    basePrice: 25.0,
    requiresAuthCode: true,
    showWhatsAppWarning: true,
  },
  {
    id: "aquecedor-portatil",
    title: "Aluguel de Mini Aquecedores Portáteis",
    description: "Mini aquecedor portátil de segurança",
    basePrice: 30.0,
    requiresAuthCode: true,
    showWhatsAppWarning: true,
  },
  {
    id: "travesseiro-extra",
    title: "Aluguel de Travesseiros Extras",
    description: "Travesseiro extra de qualidade",
    basePrice: 15.0,
    requiresAuthCode: true,
    showWhatsAppWarning: true,
  },
  {
    id: "limpeza-extra",
    title: "Limpeza Extra (S: 190 | D: 280 | T: 330)",
    description: "Higienização completa identificada automaticamente por código de tipologia",
    basePrice: 190.0,
    requiresAuthCode: true,
    showWhatsAppWarning: false,
    isCleaningDynamic: true,
  },
];

export function AdminServicosPage() {
  const [services, setServices] = useState<ServiceAdminItem[]>(DEFAULT_ADMIN_SERVICES);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddService = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "");
    const description = String(form.get("description") ?? "");
    const basePrice = Number(form.get("basePrice") ?? 0);
    const requiresAuthCode = form.get("requiresAuthCode") === "on";
    const showWhatsAppWarning = form.get("showWhatsAppWarning") === "on";

    const newService: ServiceAdminItem = {
      id: "srv-" + Date.now(),
      title,
      description,
      basePrice,
      requiresAuthCode,
      showWhatsAppWarning,
    };

    setServices((prev) => [newService, ...prev]);
    setIsCreating(false);
    toast.success("Serviço cadastrado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success("Serviço removido da plataforma");
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, basePrice: newPrice } : s))
    );
    setEditingId(null);
    toast.success("Preço atualizado!");
  };

  return (
    <div className="min-h-screen bg-[#051a14] text-[#f4efe6] p-6 lg:p-12 font-sans selection:bg-[#d8b872] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho do Admin */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#c6a35d]/20 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d8b872]">
              <ShieldCheck className="h-4 w-4" /> Gestão Operacional
            </div>
            <h1 className="font-serif text-3xl text-white">Painel de Serviços</h1>
          </div>

          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-[#d8b872] to-[#b38f46] text-[#081f19] font-semibold text-xs uppercase tracking-wider rounded-xl h-11 px-5 shadow-lg hover:brightness-105 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Novo Serviço
          </Button>
        </div>

        {/* Modal / Formulário de Cadastro Rápido */}
        {isCreating && (
          <form
            onSubmit={handleAddService}
            className="bg-[#0b2b23] border border-[#c6a35d]/40 rounded-2xl p-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-stone-700/50 pb-3">
              <h3 className="font-serif text-lg text-[#e8d5a7]">Adicionar Novo Serviço</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-stone-300">Título do Serviço</label>
                <Input
                  name="title"
                  required
                  placeholder="Ex: Aluguel de Toalhas Extras"
                  className="bg-[#081f19] border-stone-700 rounded-xl text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-stone-300">Preço Base (R$)</label>
                <Input
                  name="basePrice"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="bg-[#081f19] border-stone-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-stone-300">Descrição</label>
              <Input
                name="description"
                required
                placeholder="Detalhes para o hóspede ou proprietário..."
                className="bg-[#081f19] border-stone-700 rounded-xl text-white"
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                <input
                  type="checkbox"
                  name="requiresAuthCode"
                  defaultChecked
                  className="rounded border-stone-600 accent-[#c6a35d]"
                />
                Exigir Código de Reserva/Autorização
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                <input
                  type="checkbox"
                  name="showWhatsAppWarning"
                  defaultChecked
                  className="rounded border-stone-600 accent-[#c6a35d]"
                />
                Exibir Aviso do WhatsApp
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#c6a35d] text-[#081f19] font-semibold rounded-xl"
              >
                Salvar Serviço
              </Button>
            </div>
          </form>
        )}

        {/* Listagem dos Serviços Ativos */}
        <div className="space-y-3">
          {services.map((item) => (
            <div
              key={item.id}
              className="bg-[#0c2e25] border border-[#c6a35d]/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md text-left"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg text-white font-medium">{item.title}</h3>
                  {item.requiresAuthCode && (
                    <span className="bg-[#10382e] border border-[#c6a35d]/30 text-[#e8d5a7] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Requer Código
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 font-light">{item.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={item.basePrice}
                      id={`price-${item.id}`}
                      className="w-24 h-9 bg-[#081f19] border-stone-600 rounded-lg text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(
                          `price-${item.id}`
                        ) as HTMLInputElement;
                        handleUpdatePrice(item.id, Number(el?.value || item.basePrice));
                      }}
                      className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="font-serif text-lg text-[#d8b872] font-semibold block">
                      R$ {item.basePrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 border-l border-stone-700/60 pl-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(editingId === item.id ? null : item.id)
                    }
                    className="p-2 text-stone-400 hover:text-[#d8b872] transition-colors"
                    title="Editar Preço"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-stone-400 hover:text-red-400 transition-colors"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}