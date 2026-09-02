import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyReservation, useSelfActivateReservation } from "@/lib/api";
import { ReservationSummary } from "@/components/reservation-summary";

export const Route = createFileRoute("/hospede/vincular")({
  head: () => ({
    meta: [
      { title: "Validar hospedagem — Estadia" },
      { name: "description", content: "Informe o código do imóvel e as datas da sua estadia." },
    ],
  }),
  component: LinkStay,
});

function LinkStay() {
  const [code, setCode] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const activate = useSelfActivateReservation();
  const { data: reservation } = useMyReservation();
  const navigate = useNavigate();

  const submit = async () => {
    const value = code.trim().toUpperCase();
    if (!value) return toast.error("Informe o código do imóvel.");
    if (!checkIn || !checkOut) return toast.error("Informe check-in e check-out.");
    if (checkOut <= checkIn) return toast.error("O check-out deve ser posterior ao check-in.");
    try {
      await activate.mutateAsync({ code: value, checkIn, checkOut });
      toast.success("Hospedagem validada com sucesso!");
      navigate({ to: "/hospede/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível validar a hospedagem.");
    }
  };

  return (
    <DashboardShell title="Validar hospedagem" subtitle="Informe os dados da sua própria estadia." role="Hóspede" nav={guestNav} logoutTo="/hospede/login">
      <div className="grid gap-6">
        {reservation && <ReservationSummary reservation={reservation} />}
        {!reservation && <Card className="max-w-xl border-border/60 p-6 shadow-soft">
          <h3 className="font-serif text-lg font-semibold">Dados da hospedagem</h3>
          <p className="mt-1 text-sm text-muted-foreground">O código precisa corresponder a um imóvel cadastrado. A reserva será criada automaticamente para você.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="code">Código do imóvel</Label><Input id="code" value={code} maxLength={30} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: D-CH3579" className="mt-1 font-mono uppercase" /></div>
            <div><Label htmlFor="check-in">Check-in</Label><Input id="check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="check-out">Check-out</Label><Input id="check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || undefined} className="mt-1" /></div>
            <Button className="sm:col-span-2" onClick={() => void submit()} disabled={activate.isPending}>{activate.isPending ? "Validando…" : "Validar minha hospedagem"}</Button>
          </div>
        </Card>}
      </div>
    </DashboardShell>
  );
}
