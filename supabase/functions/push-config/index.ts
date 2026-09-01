const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  if (!vapidPublic) return Response.json({ error: "VAPID_PUBLIC_KEY não configurada." }, { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  return Response.json({ vapid_public_key: vapidPublic }, { headers: { ...cors, "Content-Type": "application/json" } });
});
