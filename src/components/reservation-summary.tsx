import { Link } from "@tanstack/react-router";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CalendarCheck, KeyRound, MapPin, BedDouble } from "lucide-react";
import { formatDate, reservationStatusLabels } from "@/lib/orders";
import { propertyTypeLabelFromCode } from "@/lib/property";
import type { ReservationRow } from "@/lib/api";

/** Cabeçalho com os dados da hospedagem do hóspede. */
export function ReservationSummary({ reservation, guestName }: { reservation: ReservationRow; guestName?: string }) {
  const apt = reservation.apartments;
  const code = apt?.code ?? "";
  const address = reservation.address ?? [apt?.address, apt?.city, apt?.state].filter(Boolean).join(", ");

  return (
    <Card className="relative overflow-hidden border-border/60 p-5 shadow-elegant sm:p-6">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
      <div className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Sua hospedagem</div>
          <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">
            {reservation.guest_name || guestName || apt?.name}
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 shrink-0" /> Imóvel {code} · Reserva {reservation.reservation_code}</span>
            <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4 shrink-0" /> {propertyTypeLabelFromCode(code)}</span>
            <span className="inline-flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0">{address || "Endereço não informado"}</span></span>
          </div>
          <div className="mt-4">
            <Badge className="bg-success text-success-foreground hover:bg-success">
              {reservationStatusLabels[reservation.status] ?? reservation.status}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div className="rounded-xl border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <CalendarCheck className="h-4 w-4" /> Check-in
            </div>
            <div className="mt-1 font-serif text-lg font-semibold sm:text-xl">{formatDate(reservation.check_in)}</div>
          </div>
          <div className="rounded-xl border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <CalendarCheck className="h-4 w-4" /> Check-out
            </div>
            <div className="mt-1 font-serif text-lg font-semibold sm:text-xl">{formatDate(reservation.check_out)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Estado exibido quando o hóspede ainda não vinculou uma hospedagem. */
export function NoReservationCard() {
  return (
    <Card className="border-border/60 p-6 text-center shadow-soft">
      <h3 className="font-serif text-xl font-semibold">Vincule sua hospedagem</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Informe o código do imóvel (ou da reserva) fornecido pela administração para liberar os
        serviços, kits e mercado.
      </p>
      <Button asChild className="mt-5">
        <Link to="/hospede/vincular">Informar código</Link>
      </Button>
    </Card>
  );
}
