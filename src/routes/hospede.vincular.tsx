import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { guestNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLinkReservation, useMyReservation } from "@/lib/api";
import { ReservationSummary } from "@/components/reservation-summary";

export const Route = createFileRoute("/hospede/vincular")({
  head: () => ({
    meta: [
      { title: "Vincular hospedagem — Estadia" },
      { name: "description", content: "Informe o código do imóvel ou da reserva para liberar os serviços da sua estadia." },
      { property: "og:title", content: "Vincular hospedagem — Estadia" },
      { property: "og:description", content: "Ative sua estadia com o código fornecido pela administração." },
    ],
  }),
  component: LinkStay,
});

function LinkStay() {
  const [code, setCode] = useState("");
  const link = useLinkReservation();
  const { data: reservation } = useMyReservation();
  const navigate = useNavigate();

  const submit = async () => {
    const value = code.trim().toUpperCase();
    if (value.length < 3) {
      toast.error("Informe um código válido.");
      return;
    }
    try {
      await link.mutateAsync(value);
      toast.success("Hospedagem vinculada com sucesso!");
      navigate({ to: "/hospede/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código não encontrado.");
    }
  };

  return (
    <DashboardShell
      title="Vincular hospedagem"
      subtitle="Use o código informado pela administração."
      role="Hóspede"
      nav={guestNav}
      logoutTo="/hospede/login"
    >
      <div className="grid gap-6">
        {reservation && <ReservationSummary reservation={reservation} />}
        <Card className="max-w-xl border-border/60 p-6 shadow-soft">
          <h3 className="font-serif text-lg font-semibold">Código do imóvel ou da reserva</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Exemplo: <span className="font-mono">S101</span> (estúdio), <span className="font-mono">D204</span> ou <span className="font-mono">T301</span>.
          </p>
          <div className="mt-5 grid gap-3">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={code}
              maxLength={20}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="S101"
              className="font-mono uppercase"
            />
            <Button onClick={() => void submit()} disabled={link.isPending}>
              {link.isPending ? "Vinculando…" : "Vincular hospedagem"}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
