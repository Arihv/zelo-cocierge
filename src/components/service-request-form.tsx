import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { brl, type OrderCategory } from "@/lib/orders";
import { priceFor, findApartmentIdByCode, useCreateOrder, usePricing, useServices } from "@/lib/api";
import { propertyTypeLabelFromCode } from "@/lib/property";

interface Props {
  category: OrderCategory;
  /** Chaves do catálogo exibidas nesta tela. */
  serviceKeys?: string[];
  title: string;
  description: string;
  /** Permite agendar data/hora. */
  scheduling?: boolean;
}

/**
 * Formulário de solicitação de serviços do hóspede.
 * O preço vem da tabela de preços da administração, considerando o tipo do imóvel (S/D/T).
 * Não exige uma reserva cadastrada no Zelo: basta informar o código do imóvel
 * da hospedagem feita por fora.
 */
export function ServiceRequestForm({ category, serviceKeys, title, description, scheduling = true }: Props) {
  const { data: services = [] } = useServices("guest");
  const { data: pricing = [] } = usePricing();
  const createOrder = useCreateOrder();

  const [qty, setQty] = useState<Record<string, number>>({});
  const [apartmentCode, setApartmentCode] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");

  const code = apartmentCode.trim() || null;

  const list = useMemo(
    () =>
      services.filter((s) =>
        serviceKeys ? serviceKeys.includes(s.key) : s.category === category,
      ),
    [services, serviceKeys, category],
  );

  const total = list.reduce(
    (sum, s) => sum + (qty[s.key] ?? 0) * priceFor(pricing, s.key, code),
    0,
  );

  const submit = async () => {
    const items = list
      .filter((s) => (qty[s.key] ?? 0) > 0)
      .map((s) => ({
        name: s.name,
        quantity: qty[s.key]!,
        unit_price: priceFor(pricing, s.key, code),
        service_key: s.key,
      }));

    if (!apartmentCode.trim()) {
      toast.error("Informe o código do imóvel da hospedagem.");
      return;
    }
    if (items.length === 0) {
      toast.error("Selecione ao menos um item.");
      return;
    }
    if (scheduling && !scheduledFor) {
      toast.error("Informe a data e o horário desejados.");
      return;
    }

    try {
      const apartmentId = await findApartmentIdByCode(apartmentCode);
      await createOrder.mutateAsync({
        category,
        total,
        details: JSON.stringify({ apartment_code: apartmentCode.trim().toUpperCase(), notes: notes.trim() || undefined }),
        apartmentId,
        reservationId: null,
        scheduledFor: scheduling && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        items,
      });
      toast.success("Solicitação enviada! Acompanhe pelo histórico.");
      setQty({});
      setNotes("");
      setScheduledFor("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a solicitação.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <Card className="border-border/60 shadow-soft">
        <div className="border-b p-5">
          <h3 className="font-serif text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-3 max-w-[10rem]">
            <Label htmlFor={`apartment-code-${category}`} className="text-xs">Código do imóvel *</Label>
            <Input id={`apartment-code-${category}`} value={apartmentCode} onChange={(e) => setApartmentCode(e.target.value.toUpperCase())} placeholder="Ex.: S101" className="mt-1 h-9 font-mono uppercase" />
          </div>
          {code && <p className="mt-1 text-xs text-muted-foreground">{propertyTypeLabelFromCode(code)}</p>}
        </div>
        <div className="divide-y">
          {list.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">Nenhum serviço disponível nesta categoria.</div>
          )}
          {list.map((s) => {
            const price = priceFor(pricing, s.key, code);
            const value = qty[s.key] ?? 0;
            return (
              <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
                <div className="min-w-0">
                  <div className="font-medium">{s.name}</div>
                  {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  <div className="mt-1 font-serif text-base font-semibold">{brl(price)}<span className="text-xs font-normal text-muted-foreground"> / {s.unit}</span></div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQty((q) => ({ ...q, [s.key]: Math.max(0, value - 1) }))}>-</Button>
                  <span className="w-8 text-center text-sm font-semibold">{value}</span>
                  <Button variant="outline" size="icon" onClick={() => setQty((q) => ({ ...q, [s.key]: value + 1 }))}>+</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="h-fit border-border/60 p-5 shadow-soft">
        <h3 className="font-serif text-lg font-semibold">Resumo</h3>
        <div className="mt-4 grid gap-4">
          {scheduling && (
            <div className="grid gap-2">
              <Label htmlFor="scheduled">Data e horário</Label>
              <Input id="scheduled" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={4} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes que ajudem a equipe." />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-2xl font-semibold">{brl(total)}</span>
          </div>
          <Button onClick={() => void submit()} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Enviando…" : "Solicitar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
