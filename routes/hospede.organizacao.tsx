import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ServiceRequestForm } from "@/components/service-request-form";
import { guestNav } from "@/lib/nav";

export const Route = createFileRoute("/hospede/organizacao")({
  head: () => ({
    meta: [
      { title: "Organização — Estadia" },
      { name: "description", content: "Solicite organização do imóvel durante a sua estadia." },
      { property: "og:title", content: "Organização — Estadia" },
      { property: "og:description", content: "Peça organização com valor conforme o tipo do imóvel." },
    ],
  }),
  component: GuestOrganization,
});

function GuestOrganization() {
  return (
    <DashboardShell
      title="Organização"
      subtitle="Deixe o imóvel do jeito que você gosta."
      role="Hóspede"
      nav={guestNav}
      logoutTo="/hospede/login"
    >
      <ServiceRequestForm
        category="organizacao"
        title="Serviços de organização"
        description="O valor é calculado automaticamente conforme o tipo do seu imóvel."
      />
    </DashboardShell>
  );
}
