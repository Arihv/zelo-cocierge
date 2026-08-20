import { createFileRoute } from "@tanstack/react-router";
import { Info, Save, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePricing, useServices } from "@/lib/api";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/precos")({ component: AdminPrecos });
type PriceState = Record<string, Record<string, string>>;
const types = ["S", "D", "T"] as const;

function AdminPrecos() {
  const { data: services = [], isLoading: servicesLoading, refetch: refreshServices } = useServices("guest");
  const { data: pricing = [], isLoading: pricingLoading, refetch: refreshPricing } = usePricing();
  const [values, setValues] = useState<PriceState>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next: PriceState = {};
    for (const service of services) {
      next[service.key] = {};
      if (service.price_by_property) for (const type of types) next[service.key][type] = String(pricing.find((p) => p.service_key === service.key && p.property_type === type)?.price ?? 0);
      else next[service.key].flat = String(pricing.find((p) => p.service_key === service.key && p.property_type === null)?.price ?? 0);
    }
    setValues(next);
  }, [services, pricing]);

  const save = async () => {
    setSaving(true);
    try {
      const rows = services.flatMap((service) => service.price_by_property ? types.map((property_type) => ({ service_key: service.key, property_type, price: Number(String(values[service.key]?.[property_type] ?? 0).replace(",", ".")) || 0 })) : [{ service_key: service.key, property_type: null, price: Number(String(values[service.key]?.flat ?? 0).replace(",", ".")) || 0 }]);
      for (const row of rows) {
        const existing = pricing.find((price) => price.service_key === row.service_key && price.property_type === row.property_type);
        const query = existing ? (supabase as any).from("pricing").update({ price: row.price }).eq("id", existing.id) : (supabase as any).from("pricing").insert(row);
        const { error } = await query;
        if (error) throw error;
      }
      await Promise.all([refreshPricing(), refreshServices()]);
      toast.success("Tabela salva. Os novos valores já aparecem para hóspedes e proprietários.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a tabela."); } finally { setSaving(false); }
  };

  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Tabela de preços" subtitle="Esta é a fonte única dos valores exibidos nas áreas de hóspedes e proprietários.">
    <div className="max-w-5xl space-y-6 text-left"><div className="flex gap-2 rounded-xl border bg-secondary/60 p-4 text-sm text-muted-foreground"><Info className="h-5 w-5 shrink-0 text-primary" />Os códigos S, D e T são obtidos automaticamente do imóvel vinculado à reserva. O hóspede não informa nem altera esse código.</div>
      {servicesLoading || pricingLoading ? <p className="text-sm text-muted-foreground">Carregando tabela…</p> : services.map((service) => <Card key={service.id}><CardHeader><div className="flex items-center gap-2"><Tags className="h-5 w-5 text-primary" /><CardTitle className="text-lg">{service.name}</CardTitle></div><CardDescription>{service.description || "Valor configurado pela administração."}</CardDescription></CardHeader><CardContent>{service.price_by_property ? <div className="grid gap-4 sm:grid-cols-3">{types.map((type) => <PriceField key={type} label={`Código ${type}`} value={values[service.key]?.[type] || ""} onChange={(value) => setValues((current) => ({ ...current, [service.key]: { ...current[service.key], [type]: value } }))} />)}</div> : <div className="max-w-sm"><PriceField label="Preço unitário" value={values[service.key]?.flat || ""} onChange={(value) => setValues((current) => ({ ...current, [service.key]: { ...current[service.key], flat: value } }))} /></div>}</CardContent></Card>)}
      <Button onClick={() => void save()} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Salvando…" : "Salvar alterações"}</Button>
    </div>
  </DashboardShell>;
}
function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="space-y-2"><Label>{label}</Label><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">R$</span><Input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /></div></div>; }
