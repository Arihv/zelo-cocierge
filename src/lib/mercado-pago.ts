import { supabase } from "@/integrations/supabase/client";

async function extractFunctionError(error: unknown, data: unknown): Promise<string | null> {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }

  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: Response }).context
    : undefined;

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { error?: unknown; message?: unknown };
      if (typeof payload.error === "string") return payload.error;
      if (typeof payload.message === "string") return payload.message;
    } catch {
      try {
        const text = await context.clone().text();
        if (text.trim()) return text.trim();
      } catch {
        // Mantém o fallback abaixo.
      }
    }
  }

  return error instanceof Error ? error.message : null;
}

export async function openMercadoPagoCheckout(orderId: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw new Error(sessionError.message || "Não foi possível validar sua sessão.");
  if (!session) throw new Error("Sessão ausente. Faça login novamente.");

  const { data, error } = await supabase.functions.invoke("mercado-pago-checkout", {
    body: { order_id: orderId },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const backendMessage = await extractFunctionError(error, data);
    throw new Error(backendMessage || "Não foi possível iniciar o pagamento.");
  }

  if (!data?.checkout_url) throw new Error(data?.error || "Não foi possível abrir o checkout.");
  window.location.assign(data.checkout_url);
}
