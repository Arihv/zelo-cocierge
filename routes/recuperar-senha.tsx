import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { DeveloperCredit } from "@/components/developer-credit";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Estadia" },
      { name: "description", content: "Receba um link por e-mail para redefinir a sua senha de acesso à plataforma Estadia." },
      { property: "og:title", content: "Recuperar senha — Estadia" },
      { property: "og:description", content: "Redefina sua senha de acesso com segurança." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60 p-6 shadow-elegant sm:p-8">
        <Brand />
        <h1 className="mt-6 font-serif text-2xl font-semibold">Recuperar senha</h1>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Verifique sua caixa de entrada e siga o link para criar uma nova senha.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe o e-mail cadastrado e enviaremos um link para criar uma nova senha.
            </p>
            <div className="mt-6 grid gap-3">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              <Button onClick={() => void submit()} disabled={loading}>
                {loading ? "Enviando…" : "Enviar link"}
              </Button>
            </div>
          </>
        )}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Voltar para o início</Link>
        </div>
      </Card>
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <DeveloperCredit className="text-primary" />
      </div>
    </div>
  );
}
