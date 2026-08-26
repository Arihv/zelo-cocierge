import { supabase } from "@/integrations/supabase/client";

export async function openMercadoPagoCheckout(orderId: string) {
  const { data, error } = await supabase.functions.invoke("mercado-pago-checkout", { body: { order_id: orderId } });

  // Quando a Edge Function retorna 4xx/5xx, o SDK também preenche `error` e
  // o detalhe útil enviado pelo backend fica em `data.error`. Priorize esse
  // detalhe para não esconder a causa real do problema no Mercado Pago.
  if (error) {
    const backendMessage = data && typeof data.error === "string" ? data.error : null;
    throw new Error(backendMessage || error.message || "Não foi possível iniciar o pagamento.");
  }

  if (!data?.checkout_url) throw new Error(data?.error || "Não foi possível abrir o checkout.");
  window.location.assign(data.checkout_url);
}
