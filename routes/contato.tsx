import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacidade";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({ meta: [{ title: "Contato — Estadia" }] }),
  component: () => (
    <LegalShell title="Fale com a Estadia">
      <p>Estamos disponíveis para ajudar hóspedes e anfitriões todos os dias da semana.</p>
      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, label: "E-mail", value: "contato@estadia.app" },
          { icon: Phone, label: "Telefone", value: "0800 123 4567" },
          { icon: MapPin, label: "Endereço", value: "Av. Central, 1000 — Sala 12" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5 shadow-soft">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-medium text-foreground">{c.value}</div>
          </div>
        ))}
      </div>
    </LegalShell>
  ),
});
