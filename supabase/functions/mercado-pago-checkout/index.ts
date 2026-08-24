import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const token = request.headers.get("Authorization");
    if (!token) throw new Error("Sessão ausente.");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: token } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Sessão inválida.");

    const { order_id } = await request.json();
    if (!order_id) throw new Error("Pedido não informado.");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleRow;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, order_number, total, details, payment_status, category")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Pedido não encontrado.");
    if (!isAdmin && order.user_id !== user.id) throw new Error("Você não tem permissão para cobrar este pedido.");
    if (order.category === "manutencao") throw new Error("Chamados de manutenção não possuem pagamento online.");
    if (order.payment_status === "approved") throw new Error("Este pedido já foi pago.");

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const siteUrl = Deno.env.get("SITE_URL");
    if (!accessToken || !siteUrl) throw new Error("Pagamento ainda não foi configurado pela administração.");

    let returnPath = isAdmin ? "/admin/pedidos" : "/hospede/historico";
    try {
      const details = JSON.parse(order.details || "{}");
      if (!isAdmin && order.category === "mercado" && details.source === "owner_market_cart") {
        returnPath = "/proprietario/pedidos";
      }
    } catch {
      // O campo detalhes é opcional e pode não conter JSON.
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{
          title: `Pedido ${order.order_number}`,
          quantity: 1,
          unit_price: Number(order.total),
          currency_id: "BRL",
        }],
        external_reference: order.id,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercado-pago-webhook`,
        back_urls: {
          success: `${siteUrl}${returnPath}`,
          failure: `${siteUrl}${returnPath}`,
          pending: `${siteUrl}${returnPath}`,
        },
        auto_return: "approved",
      }),
    });

    const preference = await response.json();
    if (!response.ok) throw new Error(preference.message || "Não foi possível iniciar o pagamento.");

    const { error: updateError } = await admin
      .from("orders")
      .update({
        payment_provider: "mercado_pago",
        payment_preference_id: preference.id,
        payment_status: "pending",
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    return Response.json(
      { checkout_url: preference.init_point, preference_id: preference.id },
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erro no pagamento." },
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
