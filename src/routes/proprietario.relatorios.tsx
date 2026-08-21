import { createFileRoute, redirect } from "@tanstack/react-router";

// Mantém links antigos seguros: relatórios existem apenas na área administrativa.
export const Route = createFileRoute("/proprietario/relatorios")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/relatorios" });
  },
  component: () => null,
});
