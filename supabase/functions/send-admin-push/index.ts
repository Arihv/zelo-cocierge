import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await request.json();
    const notificationId = body.notification_id as string | undefined;
    if (!notificationId) throw new Error("notification_id é obrigatório.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .select("id, user_id, title, body, link")
      .eq("id", notificationId)
      .single();
    if (notificationError || !notification) throw new Error("Notificação não encontrada.");

    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", notification.user_id).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("A notificação não pertence a um administrador.");

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@zelo.com.br";
    if (!vapidPublic || !vapidPrivate) throw new Error("VAPID ainda não foi configurado.");
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const { data: subscriptions } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", notification.user_id);
    const payload = JSON.stringify({ title: notification.title, body: notification.body || "Há uma nova movimentação na Zelo.", link: notification.link || "/admin/pedidos", tag: `zelo-${notification.id}` });
    const results = await Promise.all((subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload);
        return { id: subscription.id, ok: true };
      } catch (error) {
        const status = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
        if (status === 404 || status === 410) await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        return { id: subscription.id, ok: false, status };
      }
    }));

    return Response.json({ ok: true, notification_id: notification.id, results }, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao enviar push." }, { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
