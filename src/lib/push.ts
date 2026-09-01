import { supabase } from "@/integrations/supabase/client";

const ENV_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

async function getVapidPublicKey() {
  if (ENV_VAPID_PUBLIC_KEY) return ENV_VAPID_PUBLIC_KEY;
  const { data, error } = await supabase.functions.invoke("push-config", { body: {} });
  if (error) {
    const detail = data && typeof data.error === "string" ? data.error : error.message;
    throw new Error(detail || "Não foi possível obter a chave de notificações.");
  }
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

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export type PushStatus = "unsupported" | "install-required" | "permission-needed" | "denied" | "active" | "error";

export async function registerAdminPush() {
  if (typeof window === "undefined") return { status: "unsupported" as PushStatus, message: "Web Push indisponível neste ambiente." };

  // No iPhone/iPad o Web Push é disponibilizado para web apps adicionados à Tela de Início.
  if (isIos() && !isStandalone()) {
    return {
      status: "install-required" as PushStatus,
      message: "No iPhone, toque em Compartilhar → Adicionar à Tela de Início, abra a Zelo pelo novo ícone e tente novamente.",
    };
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { status: "unsupported" as PushStatus, message: "Este navegador/dispositivo não oferece Web Push neste modo." };
  }

  let vapidPublicKey: string;
  try {
    vapidPublicKey = await getVapidPublicKey();
  } catch (error) {
    return { status: "error" as PushStatus, message: error instanceof Error ? error.message : "Chave de push indisponível." };
  }

  if (Notification.permission === "denied") return { status: "denied" as PushStatus };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: permission === "denied" ? "denied" : "permission-needed" as PushStatus };

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Não foi possível ler a assinatura de push deste dispositivo.");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Sessão administrativa não encontrada. Entre novamente e tente ativar o push.");

    // RPC SECURITY DEFINER permite reassociar com segurança um endpoint antigo
    // ao administrador atualmente autenticado, sem expor assinaturas de terceiros via RLS.
    const { error: saveError } = await supabase.rpc("register_admin_push_subscription", {
      _endpoint: json.endpoint,
      _p256dh: json.keys.p256dh,
      _auth: json.keys.auth,
      _user_agent: navigator.userAgent,
    });
    if (saveError) throw new Error(saveError.message || "Não foi possível salvar a assinatura de push.");

    return { status: "active" as PushStatus };
  } catch (error) {
    return { status: "error" as PushStatus, message: error instanceof Error ? error.message : "Não foi possível ativar o push." };
  }
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
