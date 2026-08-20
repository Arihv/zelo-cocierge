import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/login-card";

export const Route = createFileRoute("/hospede/login")({
  component: () => (
    <LoginCard role="Hóspede" redirectTo="/hospede/dashboard" accentText="Sua estadia, do jeito que você merece." />
  ),
});
