import { createClient } from "npm:@supabase/supabase-js@2";

// Compara duas strings em tempo constante, para evitar timing attacks na
// verificação da assinatura.
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Valida o header x-signature enviado pelo Mercado Pago, conforme
// https://www.mercadopago.com.br/developers/pt/docs/checkout-api/webhooks#editor_2 .
// Se nenhum segredo estiver configurado, a verificação é ignorada (modo
// compatível com integrações antigas), mas fica registrado nos logs.
async function isValidSignature(request: Request, dataId: string) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET não configurado: pulando verificação de assinatura.");
    return true;
  }
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return timingSafeEqual(expected, v1);
}

Deno.serve(async (request) => {
  try {
    const url = new URL(request.url);
    const rawBody = await request.text();
    let bodyJson: { data?: { id?: string } } = {};
    try {
      bodyJson = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      bodyJson = {};
    }
    const paymentId = url.searchParams.get("data.id") || bodyJson.data?.id;
    if (!paymentId) return new Response("ignored", { status: 200 });

    if (!(await isValidSignature(request, String(paymentId)))) {
      console.error("Webhook do Mercado Pago rejeitado: assinatura inválida.");
      return new Response("invalid signature", { status: 401 });
    }

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
