import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacidade";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de Uso — Estadia" }] }),
  component: () => (
    <LegalShell title="Termos de Uso">
      <p>Ao utilizar a Estadia, você concorda com estes termos que regem o uso da plataforma por hóspedes, anfitriões e administradores.</p>
      <p>Os serviços — kits, mercado, limpeza, organização e manutenção — devem ser solicitados com a antecedência mínima definida e observando as regras específicas de cada apartamento.</p>
      <p>O uso indevido, fraude ou desrespeito às regras poderá resultar em bloqueio da conta, sem prejuízo das demais medidas cabíveis.</p>
    </LegalShell>
  ),
});
