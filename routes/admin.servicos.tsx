import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Edit2, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { adminNav } from "@/lib/nav";

export const Route = createFileRoute("/admin/servicos")({ component: AdminServicos });

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const slug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const categories = [["servico", "Serviço"], ["limpeza", "Limpeza"], ["organizacao", "Organização"], ["manutencao", "Manutenção"], ["operacional", "Operacional"]] as const;
type Service = any;

function AdminServicos() {
  const { data: services = [], refetch: refreshServices } = useQuery({
    queryKey: ["admin-service-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_catalog").select("*").order("sort_order").order("name");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
  const { data: pricing = [], refetch: refreshPricing } = useQuery({
    queryKey: ["admin-service-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("servico");
  const [audience, setAudience] = useState("guest");
  const [unit, setUnit] = useState("serviço");
  const [sortOrder, setSortOrder] = useState("10");
  const [active, setActive] = useState(true);
  const [priceByProperty, setPriceByProperty] = useState(false);
  const [flatPrice, setFlatPrice] = useState("");
  const [priceS, setPriceS] = useState("");
  const [priceD, setPriceD] = useState("");
  const [priceT, setPriceT] = useState("");
  const [saving, setSaving] = useState(false);

  const open = (service?: Service) => {
    setEditing(service ?? { id: null });
    setName(service?.name ?? "");
    setKey(service?.key ?? "");
    setDescription(service?.description ?? "");
    setCategory(service?.category ?? "servico");
    setAudience(service?.audience ?? "guest");
    setUnit(service?.unit ?? "serviço");
    setSortOrder(String(service?.sort_order ?? services.length + 1));
    setActive(service?.is_active ?? true);
    setPriceByProperty(service?.price_by_property ?? false);
    setFlatPrice(String(pricing.find((row: any) => row.service_key === service?.key && row.property_type === null)?.price ?? ""));
    setPriceS(String(pricing.find((row: any) => row.service_key === service?.key && row.property_type === "S")?.price ?? ""));
    setPriceD(String(pricing.find((row: any) => row.service_key === service?.key && row.property_type === "D")?.price ?? ""));
    setPriceT(String(pricing.find((row: any) => row.service_key === service?.key && row.property_type === "T")?.price ?? ""));
  };

  const priceNumber = (raw: string) => Number(raw.replace(",", "."));
  const savePrice = async (serviceKey: string, propertyType: "S" | "D" | "T" | null, rawValue: string) => {
    const value = priceNumber(rawValue);
    if (!Number.isFinite(value) || value < 0) throw new Error("Informe preços válidos.");
    const existing = pricing.find((row: any) => row.service_key === serviceKey && row.property_type === propertyType) as any;
    const query = existing
      ? (supabase as any).from("pricing").update({ price: value }).eq("id", existing.id)
      : (supabase as any).from("pricing").insert({ service_key: serviceKey, property_type: propertyType, price: value });
    const { error } = await query;
    if (error) throw error;
  };

  const save = async () => {
    const serviceKey = (editing?.key || key || slug(name)).trim();
    if (!name.trim()) return toast.error("Informe o nome do serviço.");
    if (!serviceKey || !/^[a-z0-9_]+$/.test(serviceKey)) return toast.error("Use apenas letras minúsculas, números e _ no identificador.");
    setSaving(true);
    try {
      const payload = { key: serviceKey, name: name.trim(), description: description.trim() || null, category, audience, unit: unit.trim() || "serviço", sort_order: Number(sortOrder) || 0, is_active: active, price_by_property: priceByProperty, icon: "sparkles" };
      const { error: serviceError } = editing?.id
        ? await (supabase as any).from("service_catalog").update(payload).eq("id", editing.id)
        : await (supabase as any).from("service_catalog").insert(payload);
      if (serviceError) throw serviceError;
      if (priceByProperty) {
        const { error } = await (supabase as any).from("pricing").delete().eq("service_key", serviceKey).is("property_type", null);
        if (error) throw error;
        await Promise.all([savePrice(serviceKey, "S", priceS), savePrice(serviceKey, "D", priceD), savePrice(serviceKey, "T", priceT)]);
      } else {
        const { error } = await (supabase as any).from("pricing").delete().eq("service_key", serviceKey).not("property_type", "is", null);
        if (error) throw error;
        await savePrice(serviceKey, null, flatPrice);
      }
      await Promise.all([refreshServices(), refreshPricing()]);
      setEditing(null);
      toast.success("Serviço salvo no catálogo da plataforma.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o serviço.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    const { error } = await (supabase as any).from("service_catalog").update({ is_active: !service.is_active }).eq("id", service.id);
    if (error) toast.error(error.message); else { await refreshServices(); toast.success(service.is_active ? "Serviço ocultado." : "Serviço publicado."); }
  };
  const remove = async (service: Service) => {
    if (!window.confirm(`Excluir o serviço “${service.name}”? Essa ação não pode ser desfeita.`)) return;
    const { error } = await (supabase as any).from("service_catalog").delete().eq("id", service.id);
    if (error) toast.error(error.message); else { await Promise.all([refreshServices(), refreshPricing()]); toast.success("Serviço excluído."); }
  };

  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Gestão de serviços" subtitle="Cadastre, edite, publique ou exclua os serviços exibidos na plataforma.">
    <div className="mx-auto max-w-6xl space-y-6 text-left">
      <Card className="border-primary/15 bg-muted/30"><CardContent className="p-5 text-sm text-muted-foreground">Tudo o que for salvo aqui usa o catálogo real. Serviços ativos aparecem para o público selecionado; os ocultos ficam guardados para a administração.</CardContent></Card>
      <div className="flex justify-end"><Button onClick={() => open()}><Plus className="mr-2 h-4 w-4" />Adicionar serviço</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service: Service) => {
          const flat = pricing.find((row: any) => row.service_key === service.key && row.property_type === null) as any;
          const prices = ["S", "D", "T"].map((type) => pricing.find((row: any) => row.service_key === service.key && row.property_type === type) as any);
          return <Card key={service.id} className={!service.is_active ? "opacity-70" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-base">{service.name}</CardTitle><CardDescription className="mt-1">{service.description || "Sem descrição"}</CardDescription></div><Badge variant={service.is_active ? "outline" : "secondary"}>{service.is_active ? "Publicado" : "Oculto"}</Badge></div></CardHeader><CardContent className="space-y-4 border-t pt-4"><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{service.category}</span><span>•</span><span>{service.audience === "all" ? "Hóspedes e proprietários" : service.audience === "host" ? "Proprietários" : "Hóspedes"}</span><span>•</span><span>{service.unit}</span></div><strong>{service.price_by_property ? `S ${brl(Number(prices[0]?.price ?? 0))} · D ${brl(Number(prices[1]?.price ?? 0))} · T ${brl(Number(prices[2]?.price ?? 0))}` : brl(Number(flat?.price ?? 0))}</strong><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => open(service)}><Edit2 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={() => void toggleActive(service)}>{service.is_active ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}{service.is_active ? "Ocultar" : "Publicar"}</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(service)} aria-label={`Excluir ${service.name}`}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>;
        })}
      </div>
      {services.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado. Use “Adicionar serviço” para começar.</CardContent></Card>}
    </div>
    <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Nome do serviço</Label><Input value={name} onChange={(event) => { setName(event.target.value); if (!editing?.id) setKey(slug(event.target.value)); }} placeholder="Ex.: Aluguel de toalhas extras" /></div>
      <div><Label>Identificador interno</Label><Input value={editing?.id ? editing.key : key} disabled={!!editing?.id} onChange={(event) => setKey(slug(event.target.value))} placeholder="aluguel_toalhas" /><p className="mt-1 text-xs text-muted-foreground">Usado pela plataforma e não muda depois de criado.</p></div>
      <div><Label>Categoria</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <div><Label>Exibir para</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}><option value="guest">Hóspedes</option><option value="host">Proprietários</option><option value="all">Hóspedes e proprietários</option></select></div>
      <div><Label>Unidade de cobrança</Label><Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="serviço" /></div><div><Label>Ordem de exibição</Label><Input inputMode="numeric" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></div>
      <div className="flex items-end gap-3 pb-2"><Switch checked={active} onCheckedChange={setActive} id="active-service" /><Label htmlFor="active-service">Publicar agora</Label></div>
      <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique o que está incluído no serviço." rows={3} /></div>
      <div className="sm:col-span-2 rounded-lg border p-4"><div className="flex items-center justify-between gap-4"><div><Label htmlFor="price-by-property">Preço por tipologia (S, D e T)</Label><p className="mt-1 text-xs text-muted-foreground">Ative para definir valores diferentes conforme a tipologia do imóvel.</p></div><Switch checked={priceByProperty} onCheckedChange={setPriceByProperty} id="price-by-property" /></div>{priceByProperty ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><Label>Preço S (R$)</Label><Input inputMode="decimal" value={priceS} onChange={(event) => setPriceS(event.target.value)} /></div><div><Label>Preço D (R$)</Label><Input inputMode="decimal" value={priceD} onChange={(event) => setPriceD(event.target.value)} /></div><div><Label>Preço T (R$)</Label><Input inputMode="decimal" value={priceT} onChange={(event) => setPriceT(event.target.value)} /></div></div> : <div className="mt-4"><Label>Preço único (R$)</Label><Input inputMode="decimal" value={flatPrice} onChange={(event) => setFlatPrice(event.target.value)} /></div>}</div>
    </div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Salvar serviço"}</Button></DialogFooter></DialogContent></Dialog>
  </DashboardShell>;
}
