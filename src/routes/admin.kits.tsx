import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePricing, useServices } from "@/lib/api";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/kits")({ component: AdminKits });
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const slug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function AdminKits() {
  const { data: catalog = [], refetch: refreshCatalog } = useServices("guest");
  const { data: pricing = [], refetch: refreshPricing } = usePricing();
  const kits = catalog.filter((service) => service.category === "kit");
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [price, setPrice] = useState(""); const [active, setActive] = useState(true); const [saving, setSaving] = useState(false);
  const open = (kit?: any) => { setEditing(kit || { id: null }); setName(kit?.name || ""); setDescription(kit?.description || ""); setPrice(String(pricing.find((row) => row.service_key === kit?.key && row.property_type === null)?.price ?? "")); setActive(kit?.is_active ?? true); };
  const save = async () => {
    if (!name.trim()) { toast.error("Informe o nome do kit."); return; }
    setSaving(true);
    try {
      const key = editing?.key || `kit_${slug(name)}`;
      const payload = { key, name: name.trim(), description: description.trim() || null, category: "kit", audience: "guest", price_by_property: false, unit: "kit", icon: "package", is_active: active, sort_order: editing?.sort_order ?? 50 };
      const { error: catalogError } = editing?.id ? await (supabase as any).from("service_catalog").update(payload).eq("id", editing.id) : await (supabase as any).from("service_catalog").insert(payload);
      if (catalogError) throw catalogError;
      const priceValue = Number(price.replace(",", "."));
      if (!Number.isFinite(priceValue) || priceValue < 0) throw new Error("Informe um preço válido.");
      const existing = pricing.find((row) => row.service_key === key && row.property_type === null);
      const { error: priceError } = existing ? await (supabase as any).from("pricing").update({ price: priceValue }).eq("id", existing.id) : await (supabase as any).from("pricing").insert({ service_key: key, property_type: null, price: priceValue });
      if (priceError) throw priceError;
      await Promise.all([refreshCatalog(), refreshPricing()]); setEditing(null); toast.success("Kit salvo e publicado para os hóspedes.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar o kit."); } finally { setSaving(false); }
  };
  const remove = async (kit: any) => { if (!window.confirm(`Excluir o kit “${kit.name}”?`)) return; const { error } = await (supabase as any).from("service_catalog").delete().eq("id", kit.id); if (error) toast.error(error.message); else { await refreshCatalog(); toast.success("Kit removido."); } };
  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Kits & cardápio" subtitle="Crie e edite os kits que aparecem para hóspedes, sem alterar código."><div className="mx-auto max-w-5xl space-y-6 text-left"><div className="flex justify-end"><Button onClick={() => open()}><Plus className="mr-2 h-4 w-4" />Novo kit</Button></div><div className="grid gap-4 md:grid-cols-2">{kits.map((kit) => { const priceValue = Number(pricing.find((row) => row.service_key === kit.key && row.property_type === null)?.price || 0); return <Card key={kit.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-base">{kit.name}</CardTitle><CardDescription className="mt-1 whitespace-pre-line text-xs">{kit.description}</CardDescription></div><Badge variant={kit.is_active ? "outline" : "secondary"}>{kit.is_active ? "Ativo" : "Oculto"}</Badge></div></CardHeader><CardContent className="flex items-center justify-between border-t pt-4"><strong>{brl(priceValue)}</strong><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => open(kit)}><Edit2 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(kit)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>; })}</div>{kits.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum kit cadastrado. Use “Novo kit” para começar.</CardContent></Card>}</div><Dialog open={!!editing} onOpenChange={(openState) => !openState && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{editing?.id ? "Editar kit" : "Novo kit"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Nome</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label>Descrição e itens</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} placeholder="Uma linha por item do kit" /></div><div><Label>Preço (R$)</Label><Input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Exibir para hóspedes</label></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Salvar"}</Button></DialogFooter></DialogContent></Dialog></DashboardShell>;
}
