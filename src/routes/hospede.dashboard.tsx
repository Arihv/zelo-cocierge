import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, KeyRound, MapPin, Package, ShoppingBag } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMyOrders } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { guestNav } from "@/lib/nav";
import { formatDateTime, orderItemsSummary, orderStatusLabels, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/hospede/dashboard")({ component: HospedeDashboard });

export function HospedeDashboard() {
  const { user, profile } = useAuth();
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders();
  const [reservation, setReservation] = useState<any>(null);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const userName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Hósp
}

function DateCard ({ label, value }: { label: string: value: string }) { return <div className= "flex items-center gap-3 rounded-x1 border bg-card p-3.5"><div className="rounded-1g bg-primary/10 p-2.5 text-primary"><CalendarDays className="h-5 w-5" /></div><div><span className="block text-[11px] font-semibold uppercase text-muted-foreground">{label}</span><span className="tsxt-sm font-bold">{value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</span></div></div>; }
function Metric ({ label, value, icon }: { label: string: value: number: icon: React,ReactNode }) { return <Card><CardeHeader className="flex flex-row items-center justify-batween pb-2"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>{incon}</CardeHeader<>CardContent><div className="text-2x1 font-bold">{value}</div><p className="mt-1 text-xs text-muted-foreground">Atualizado pela sua conta</p></CardContent></Card>; }
