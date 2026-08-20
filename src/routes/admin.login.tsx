import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/login-card";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <LoginCard
      role="Administração"
      redirectTo="/admin/dashboard"
      accentText="Painel Operacional & Gestão Estratégica"
      allowSignup={false}
    />
  );
}