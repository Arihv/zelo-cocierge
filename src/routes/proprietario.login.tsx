import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/login-card";

export const Route = createFileRoute("/proprietario/login")({
  component: () => (
    <LoginCard role="Proprietário" redirectTo="/proprietario/dashboard" accentText="Gestão elegante para cada apartamento." />
  ),
});
