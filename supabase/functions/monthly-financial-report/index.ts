import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-cron-secret",
};

type ReportOrder = {
  order_number: string | null;
  total: number | string | null;
  category: string | null;
  paid_at: string | null;
  created_at: string;
};

function monthRange(value: string | null) {
  const now = new Date();
  const raw = value && /^\d{4}-\d{2}$/.test(value)
    ? `${value}-01T00:00:00.000Z`
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) throw new Error("Mês inválido. Use AAAA-MM.");
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start, end, key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}` };
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const expectedSecret = Deno.env.get("MONTHLY_FINANCIAL_REPORT_CRON_SECRET");
    if (!expectedSecret || request.headers.get("x-cron-secret") !== expectedSecret) {
      return Response.json({ error: "Não autorizado." }, { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { start, end, key } = monthRange(new URL(request.url).searchParams.get("month"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceKey || !resendKey) throw new Error("Configuração de relatório incompleta.");

    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin
      .from("orders")
      .select("order_number, total, category, paid_at, created_at")
      .neq("category", "manutencao")
      .eq("payment_status", "approved")
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString())
      .order("paid_at", { ascending: true });
    if (error) throw error;

    const orders = (data || []) as ReportOrder[];
    const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const rows = orders.map((order) => {
      const date = new Date(order.paid_at || order.created_at).toLocaleString("pt-BR");
      return `<tr><td>${escapeHtml(order.order_number || "—")}</td><td>${escapeHtml(order.category || "Pedido")}</td><td>${escapeHtml(date)}</td><td>${brl(Number(order.total || 0))}</td></tr>`;
    }).join("") || `<tr><td colspan="4">Nenhum pagamento aprovado neste período.</td></tr>`;
    const csv = ["Pedido;Categoria;Pago em;Total", ...orders.map((order) => [order.order_number || "", order.category || "", new Date(order.paid_at || order.created_at).toLocaleString("pt-BR"), Number(order.total || 0).toFixed(2).replace(".", ",")].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))].join("\n");
    const recipient = Deno.env.get("FINANCIAL_REPORT_EMAIL") || "zeloconciergeria@gmail.com";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Zelo Concierge & Hospitalidade <no-reply@zeloconciergeria.com.br>",
        to: [recipient],
        subject: `Relatório financeiro Zelo — ${key}`,
        html: `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f6f3ed;font-family:Arial,sans-serif;color:#163c34"><div style="max-width:680px;margin:auto;background:#fff;padding:32px;border-radius:16px"><h1 style="margin-top:0;color:#0d4c41">Relatório financeiro mensal</h1><p>Período: <strong>${key}</strong></p><p>Pedidos aprovados: <strong>${orders.length}</strong><br>Total recebido: <strong>${brl(total)}</strong></p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Pedido</th><th align="left">Categoria</th><th align="left">Pago em</th><th align="right">Total</th></tr></thead><tbody>${rows}</tbody></table><p style="color:#61706f;font-size:13px">Chamados de manutenção não fazem parte deste relatório financeiro. A planilha CSV está anexada.</p></div></body></html>`,
        attachments: [{ filename: `relatorio-financeiro-${key}.csv`, content: toBase64(csv) }],
      }),
    });
    if (!emailResponse.ok) throw new Error(`Resend: ${await emailResponse.text()}`);

    return Response.json({ ok: true, period: key, approved_orders: orders.length, total }, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível gerar o relatório." }, { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
