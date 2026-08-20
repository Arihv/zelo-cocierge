import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ServiceRequestForm } from "@/components/service-request-form";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/limpeza")({
  head: () => ({
    meta: [
      { title: "Limpeza — Estadia" },
      { name: "description", content: "Solicite limpeza da sua hospedagem com preço conforme o tipo do imóvel." },
      { property: "og:title", content: "Limpeza — Estadia" },
      { property: "og:description", content: "Agende a limpeza da sua estadia em poucos cliques." },
    ],
  }),
  component: GuestCleaning,
});

function GuestCleaning() {
  return (
    <DashboardShell
      title="Limpeza"
      subtitle="Agende a limpeza da sua hospedagem."
      role="Hóspede"
      nav={guestNav}
      logoutTo="/hospede/login"
    >
      <ServiceRequestForm
        category="limpeza"
        title="Serviços de limpeza"
        description="O valor é calculado automaticamente conforme o tipo do seu imóvel."
      />
    </DashboardShell>
  );
}
