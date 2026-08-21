import { createFileRoute, redirect } from "@tanstack/react-router";

// A manutenção dos valores agora é feita nas respectivas áreas de serviços, kits e mercado.
export const Route = createFileRoute("/admin/precos")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: () => null,
});
