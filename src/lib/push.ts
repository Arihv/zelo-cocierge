import { supabase } from "@/integrations/supabase/client";

const ENV_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

async function getVapidPublicKey() {
  if (ENV_VAPID_PUBLIC_KEY) return ENV_VAPID_PUBLIC_KEY;
  const { data, error } = await supabase.functions.invoke("push-config", { body: {} });
  if (error) throw new Error("Não foi possível obter a chave de notificações.");
  const key = data?.vapid_public_key as string | undefined;
  if (!key) throw new Error("VAPID_PUBLIC_KEY não configurada no Supabase.");
  return key;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export type PushStatus = "unsupported" | "permission-needed" | "denied" | "active" | "error";

export async function registerAdminPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return { status: "unsupported" as PushStatus };
  let vapidPublicKey: string;
  try { vapidPublicKey = await getVapidPublicKey(); } catch (error) { return { status: "error" as PushStatus, message: error instanceof Error ? error.message : "Chave de push indisponível." }; }
  if (Notification.permission === "denied") return { status: "denied" as PushStatus };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: permission === "denied" ? "denied" : "permission-needed" as PushStatus };

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Não foi possível registrar este dispositivo.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão administrativa não encontrada.");
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent, last_seen_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) throw error;
  return { status: "active" as PushStatus };
}

export async function unregisterAdminPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
