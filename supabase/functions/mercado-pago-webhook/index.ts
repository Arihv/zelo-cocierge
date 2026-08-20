import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (request) => {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("data.id") || (await request.json().catch(() => ({}))).data?.id;
    if (!paymentId) return new Response("ignored", { status: 200 });
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) throw new Error("Mercado Pago não configurado.");
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || !payment.external_reference) return new Response("ignored", { status: 200 });
    const status = payment.status === "approved" ? "approved" : payment.status === "rejected" ? "rejected" : payment.status === "cancelled" ? "cancelled" : "pending";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("orders").update({ payment_provider: "mercado_pago", payment_id: String(payment.id), payment_status: status, paid_at: status === "approved" ? new Date().toISOString() : null }).eq("id", payment.external_reference);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("error", { status: 500 });
  }
});
