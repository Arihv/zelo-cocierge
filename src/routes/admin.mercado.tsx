import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Boxes, PackagePlus, Pencil, Search, Trash2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { useMarketStore, type MarketProduct } from "@/hooks/use-market-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/mercado")({ component: AdminMercadoPage });
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AdminMercadoPage() {
  const { products, categories, loading, createProduct, updateProduct, deleteProduct, createCategory, deleteCategory } = useMarketStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [editing, setEditing] = useState<MarketProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from("site_settings").select("minimum_order_amount, delivery_fee").eq("id", 1).maybeSingle();
      if (error) { toast.error("Não foi possível carregar as configurações do pedido."); return; }
      if (data) { setMinimumOrder(String(data.minimum_order_amount ?? 0)); setDeliveryFee(String(data.delivery_fee ?? 0)); }
    })();
  }, []);

  const saveSettings = async () => {
    const minimum = Number(minimumOrder.replace(",", "."));
    const fee = Number(deliveryFee.replace(",", "."));
    if (!Number.isFinite(minimum) || minimum < 0 || !Number.isFinite(fee) || fee < 0) { toast.error("Informe valores válidos para o pedido mínimo e a taxa."); return; }
    setSettingsSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ id: 1, minimum_order_amount: minimum, delivery_fee: fee });
    setSettingsSaving(false);
    if (error) toast.error("Não foi possível salvar as configurações.");
    else toast.success("Configurações de pedido atualizadas.");
  };

  const filtered = useMemo(() => products.filter((product) => (category === "Todas" || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const empty = products.filter((product) => product.stock === 0).length;
  const low = products.filter((product) => product.stock > 0 && product.stock <= 5).length;

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim(); const productCategory = String(data.get("category") ?? ""); const price = Number(data.get("price") ?? 0); const stock = Number(data.get("stock") ?? 0); const options = String(data.get("options") ?? "").trim();
    if (!name || !productCategory || price < 0 || stock < 0) { toast.error("Preencha nome, categoria, preço e estoque corretamente."); return; }
    setSaving(true);
    try { if (editing) await updateProduct(editing.id, { name, category: productCategory, price, stock, options }); else await createProduct({ name, category: productCategory, price, stock, options }); toast.success(editing ? "Produto atualizado em tempo real." : "Produto adicionado ao estoque."); setEditing(null); setCreating(false); }
    catch { toast.error("Não foi possível salvar o produto no Supabase."); }
    setSaving(false);
  };
  const removeProduct = async (product: MarketProduct) => { if (!window.confirm(`Remover “${product.name}” do catálogo?`)) return; try { await deleteProduct(product.id); toast.success("Produto removido."); } catch { toast.error("Não foi possível remover o produto."); } };

  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Minimercado & Estoque" subtitle="Cadastre produtos e ajuste o estoque. As alterações são sincronizadas em tempo real.">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Itens cadastrados</span><Boxes className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{products.length}</div><p className="mt-1 text-xs text-muted-foreground">Produtos reais no catálogo</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Produtos esgotados</span><AlertTriangle className="h-4 w-4 text-amber-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{empty}</div><p className="mt-1 text-xs text-muted-foreground">Itens com 0 unidade disponível</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><span className="text-sm text-muted-foreground">Produtos com estoque baixo</span><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{low}</div><p className="mt-1 text-xs text-muted-foreground">Itens com até 5 unidades</p></CardContent></Card></div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> Configurações de pedidos</CardTitle><CardDescription>Defina o valor mínimo para uma compra e a taxa de entrega cobrada do hóspede.</CardDescription></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,auto] lg:items-end"><div className="space-y-1.5"><Label>Pedido mínimo (R$)</Label><Input value={minimumOrder} onChange={(e) => setMinimumOrder(e.target.value)} inputMode="decimal" placeholder="0,00" /></div><div className="space-y-1.5"><Label>Taxa de entrega (R$)</Label><Input value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} inputMode="decimal" placeholder="0,00" /></div><Button onClick={() => void saveSettings()} disabled={settingsSaving} className="gap-2"><Save className="h-4 w-4" />{settingsSaving ? "Salvando…" : "Salvar configurações"}</Button></div></CardContent></Card>

      <Card><CardHeader><CardTitle>Organização por categorias</CardTitle><CardDescription>Crie as categorias usadas no minimercado. Produtos só podem ser excluídos de uma categoria depois de serem movidos para outra.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Ex.: Higiene e Limpeza" /><Button type="button" onClick={() => void (async () => { try { await createCategory(newCategory); setNewCategory(""); toast.success("Categoria adicionada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar a categoria."); } })()}>Adicionar categoria</Button></div><div className="flex flex-wrap gap-2">{categories.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-3 py-1.5 text-xs font-medium">{item}<button type="button" className="ml-1 text-muted-foreground hover:text-destructive" title={`Excluir ${item}`} onClick={() => void (async () => { if (!window.confirm(`Excluir a categoria “${item}”?`)) return; try { await deleteCategory(item); toast.success("Categoria excluída."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível excluir a categoria."); } })()}><Trash2 className="h-3 w-3" /></button></span>)}</div></CardContent></Card>

      <Card className="overflow-hidden"><CardHeader className="border-b bg-primary/5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-lg">Catálogo de produtos</CardTitle><CardDescription>Gerencie os itens existentes no local e mantenha as quantidades atualizadas.</CardDescription></div><Button onClick={() => setCreating(true)} className="w-full gap-2 sm:w-auto"><PackagePlus className="h-4 w-4" /> Novo produto</Button></div></CardHeader><CardContent className="space-y-5 p-3 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto" className="pl-9" /></div><div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto">{["Todas", ...categories].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${category === item ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{item}</button>)}</div></div>{loading ? <div className="py-12 text-center text-sm text-muted-foreground">Carregando estoque…</div> : null}{!loading && filtered.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center"><Boxes className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">{products.length ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}</h3><p className="mt-1 text-sm text-muted-foreground">{products.length ? "Altere os filtros ou a busca." : "Adicione o primeiro produto com a quantidade real disponível."}</p>{!products.length ? <Button onClick={() => setCreating(true)} className="mt-4">Adicionar primeiro produto</Button> : null}</div> : null}{!loading && filtered.length > 0 ? <div className="grid gap-3 md:grid-cols-2">{filtered.map((product) => <div key={product.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{product.category}</p><h3 className="truncate font-semibold">{product.name}</h3><p className="mt-1 text-sm text-muted-foreground">{money(product.price)}</p>{product.options ? <p className="mt-1 text-xs text-muted-foreground">Opções: {product.options}</p> : null}</div><div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3"><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock === 0 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : product.stock <= 5 ? "bg-red-500/15 text-red-700 dark:text-red-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}`}>{product.stock === 0 ? "Esgotado" : `${product.stock} un`}</span><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => setEditing(product)} title="Editar"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void removeProduct(product)} className="text-destructive hover:text-destructive" title="Remover"><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</div> : null}</CardContent></Card>
    </div>
    <Dialog open={creating || Boolean(editing)} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader><form onSubmit={saveProduct} className="space-y-4"><div className="space-y-1.5"><Label>Nome</Label><Input name="name" defaultValue={editing?.name} placeholder="Ex.: Água mineral 500 ml" required /></div><div className="space-y-1.5"><Label>Categoria</Label><select name="category" defaultValue={editing?.category ?? categories[0]} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="space-y-1.5"><Label>Opções do produto</Label><Input name="options" defaultValue={editing?.options ?? ""} placeholder="Ex.: 500 ml, 1 L, sem gás, com gás" /><p className="text-[11px] text-muted-foreground">Separe as opções por vírgula. O hóspede poderá escolher antes de adicionar.</p></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Preço (R$)</Label><Input name="price" type="number" min="0" step="0.01" defaultValue={editing?.price ?? 0} required /></div><div className="space-y-1.5"><Label>Estoque (un.)</Label><Input name="stock" type="number" min="0" step="1" defaultValue={editing?.stock ?? 0} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar produto"}</Button></DialogFooter></form></DialogContent></Dialog>
  </DashboardShell>;
}
