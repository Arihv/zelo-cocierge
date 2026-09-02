import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathFor, type AppRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
          });
          if (error) throw error;
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          throw new Error("A confirmação foi recebida, mas a sessão não pôde ser iniciada. Volte ao login e entre com seu e-mail e senha.");
        }

        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sessionData.session.user.id)
          .maybeSingle();

        if (cancelled) return;
        setMessage("E-mail confirmado! Entrando na sua conta…");
        const role = (roleRow?.role as AppRole | undefined) ?? "guest";
        navigate({ to: dashboardPathFor(role), replace: true });
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Não foi possível confirmar seu e-mail. Volte ao login e tente novamente.");
      }
    };

    void finish();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#081f19] px-6 py-20 text-[#f4efe6]">
      <div className="mx-auto max-w-md rounded-2xl border border-[#c6a35d]/30 bg-[#0c2b23] p-8 text-center shadow-2xl">
        <img src="/zelo-logo.png" alt="Zelo" className="mx-auto mb-5 h-16 w-16 rounded-xl object-cover" />
        <h1 className="font-serif text-2xl">Confirmação de cadastro</h1>
        <p className="mt-3 text-sm text-stone-300">{message}</p>
        <a href="/hospede/login" className="mt-6 inline-flex rounded-xl bg-[#e6d4aa] px-5 py-3 text-sm font-semibold text-[#241d0c]">
          Voltar ao login
        </a>
      </div>
    </main>
  );
}
