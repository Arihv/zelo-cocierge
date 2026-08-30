import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { DeveloperCredit } from "@/components/developer-credit";
import { type ReactNode } from "react";

export function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-20 w-full max-w-4xl items-center justify-between px-6">
          <Brand />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Voltar</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-serif text-4xl font-semibold">{title}</h1>
        <div className="prose prose-sm mt-8 max-w-none text-muted-foreground">{children}</div>
      </main>
      <footer className="mt-auto border-t px-6 py-4 text-center text-xs text-muted-foreground">
        <DeveloperCredit className="text-primary" />
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Estadia" }] }),
  component: () => (
    <LegalShell title="Política de Privacidade">
      <p>Esta plataforma respeita a sua privacidade. Coletamos apenas as informações estritamente necessárias para prestar os serviços de hospedagem, como dados de identificação, contato e detalhes de pedidos.</p>
      <p>Seus dados são armazenados de forma segura e não são compartilhados com terceiros exceto quando necessário para a prestação do serviço (por exemplo, meios de pagamento).</p>
      <p>Você pode solicitar a qualquer momento a atualização ou exclusão dos seus dados através da nossa central de contato.</p>
    </LegalShell>
  ),
});
