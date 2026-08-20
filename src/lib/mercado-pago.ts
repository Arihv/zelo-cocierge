import { supabase } from "@/integrations/supabase/client";

export async function openMercadoPagoCheckout(orderId: string) {
  const { data, error } = await supabase.functions.invoke("mercado-pago-checkout", { body: { order_id: orderId } });
  if (error) throw error;
  if (!data?.checkout_url) throw new Error(data?.error || "Não foi possível abrir o checkout.");
  window.location.assign(data.checkout_url);
}
