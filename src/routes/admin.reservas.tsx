import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarRange, Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { adminNav } from "@/lib/nav";
import { useAllOrders } from "@/lib/api";
import { formatDateTime, orderCategoryLabels, orderItemsSummary, orderStatusLabels, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/admin/reservas")({ component: AdminReservas });
type Apartment = { id: string; code: string | null; name: string };
type Reservation = { id: string; reservation_code: string; guest_id: string | null; guest_name: string | null; apartment_id: string; check_in: string; check_out: string; status: "pendente" | "confirmada" | "ativa" | "finalizada" | "cancelada" };

export function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [viewing, setViewing] = useState<Reservation | null>(null);
  const [open, setOpen] = useState(false);
  const { data: orders = [] } = useAllOrders();
  const [form, setForm] = useState({ reservation_code: "", guest_name: "", apartment_id: "", check_in: "", check_out: "", status: "confirmada" as Reservation["status"] });

  const load = async () => {
    const [reservationsResult, apartmentsResult] = await Promise.all([
      supabase.from("reservations").select("id, reservation_code, guest_id, guest_name, apartment_id, check_in, check_out, status").order("check_in"),
      supabase.from("apartments").select("id, code, name").order("code"),
    ]);
    if (reservationsResult.error || apartmentsResult.error) return toast.error(reservationsResult.error?.message || apartmentsResult.error?.message || "Erro ao carregar dados.");
    setReservations(reservationsResult.data as Reservation[]);
    setApartments(apartmentsResult.data);
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel("admin-reservations-live").on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const openNew = () => { setEditing(null); setForm({ reservation_code: `RES-${Date.now().toString().slice(-6)}`, guest_name: "", apartment_id: apartments[0]?.id ?? "", check_in: "", check_out: "", status: "confirmada" }); setOpen(true); };
  const openEdit = (reservation: Reservation) => { setEditing(reservation); setForm({ reservation_code: reservation.reservation_code, guest_name: reservation.guest_name ?? "", apartment_id: reservation.apartment_id, check_in: reservation.check_in, check_out: reservation.check_out, status: reservation.status }); setOpen(true); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!form.apartment_id) return toast.error("Cadastre um imóvel antes de criar uma reserva."); const data = { ...form, guest_name: form.guest_name || null }; const query = editing ? supabase.from("reservations").update(data).eq("id", editing.id) : supabase.from("reservations").insert(data); const { error } = await query; if (error) return toast.error(error.message); toast.success(editing ? "Reserva atualizada." : "Reserva criada. O hóspede pode ativá-la pelo código."); setOpen(false); void load(); };
  const remove = async (id: string) => { if (!confirm("Excluir esta reserva?")) return; const { error } = await supabase.from("reservations").delete().eq("id", id); if (error) return toast.error(error.message); toast.success("Reserva excluída."); void load(); };
  const apartment = (id: string) => apartments.find((item) => item.id === id);
  const relatedOrders = (reservation: Reservation) => orders.filter((order) => order.reservation_id === reservation.id || (order.apartment_id === reservation.apartment_id && (!reservation.guest_id || order.user_id === reservation.guest_id)));

  return <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Gestão de Reservas" subtitle="Reservas ativadas pelo hóspede aparecem aqui automaticamente."><div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Reservas cadastradas ({reservations.length})</h2><p className="text-xs text-muted-foreground">Abra uma reserva para ver seus pedidos e solicitações relacionados.</p></div><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova reserva</Button></div><div className="space-y-4">{reservations.map((reservation) => { const count = relatedOrders(reservation).length; return <Card key={reservation.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{reservation.reservation_code}</Badge><h3 className="font-semibold">{reservation.guest_name || "Hóspede ainda não vinculado"}</h3><Badge>{reservation.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Imóvel: {apartment(reservation.apartment_id)?.code || "—"} · {apartment(reservation.apartment_id)?.name || ""} · {count} {count === 1 ? "solicitação" : "solicitações"}</p></div><div className="flex flex-wrap items-center gap-2 text-xs"><span>{reservation.check_in} → {reservation.check_out}</span><Button variant="outline" size="sm" onClick={() => setViewing(reservation)}><Eye className="mr-1 h-3.5 w-3.5" />Pedidos</Button><Button variant="ghost" size="sm" onClick={() => openEdit(reservation)}><Edit2 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(reservation.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></CardContent></Card>; })}{!reservations.length && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"><CalendarRange className="mx-auto mb-2 h-6 w-6" />Nenhuma reserva cadastrada.</div>}</div></div>

  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar reserva" : "Nova reserva"}</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={save}><Input value={form.reservation_code} onChange={(event) => setForm({ ...form, reservation_code: event.target.value.toUpperCase() })} placeholder="Código da reserva" required /><Input value={form.guest_name} onChange={(event) => setForm({ ...form, guest_name: event.target.value })} placeholder="Nome do hóspede (opcional)" /><select className="h-10 w-full rounded-md border bg-background px-3" value={form.apartment_id} onChange={(event) => setForm({ ...form, apartment_id: event.target.value })} required><option value="">Selecione o imóvel</option>{apartments.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select><div className="grid grid-cols-2 gap-3"><Input type="date" value={form.check_in} onChange={(event) => setForm({ ...form, check_in: event.target.value })} required /><Input type="date" value={form.check_out} onChange={(event) => setForm({ ...form, check_out: event.target.value })} required /></div><select className="h-10 w-full rounded-md border bg-background px-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Reservation["status"] })}><option value="confirmada">Confirmada</option><option value="ativa">Ativa</option><option value="pendente">Pendente</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select><Button className="w-full" type="submit">Salvar</Button></form></DialogContent></Dialog>

  <Dialog open={Boolean(viewing)} onOpenChange={(value) => { if (!value) setViewing(null); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Pedidos da reserva {viewing?.reservation_code}</DialogTitle></DialogHeader><div className="max-h-[60vh] overflow-y-auto divide-y">{viewing && relatedOrders(viewing).length ? relatedOrders(viewing).map((order) => <div key={order.id} className="space-y-1 py-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{order.order_number} · {orderCategoryLabels[order.category]}</p><p className="text-sm text-muted-foreground">{orderItemsSummary(order)}</p></div><Badge variant={statusTone(order.status)}>{orderStatusLabels[order.status]}</Badge></div><p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ou solicitação vinculado a esta reserva.</p>}</div></DialogContent></Dialog>
  </DashboardShell>;
}
