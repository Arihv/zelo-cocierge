import { supabase } from "@/integrations/supabase/client";

export async function openMercadoPagoCheckout(orderId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message || "Não foi possível validar sua sessão.");
  }

  if (!session) {
    throw new Error("Sessão ausente. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke(
    "mercado-pago-checkout",
    {
      body: { order_id: orderId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (error) {
    const backendMessage =
      data && typeof data.error === "string" ? data.error : null;

    throw new Error(
      backendMessage ||
        error.message ||
        "Não foi possível iniciar o pagamento.",
    );
  }

  if (!data?.checkout_url) {
    throw new Error(
      data?.error || "Não foi possível abrir o checkout.",
    );
  }

  window.location.assign(data.checkout_url);
}
