import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, LogOut, type LucideIcon, Smartphone } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "./ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { WhatsappButton } from "./whatsapp-button";
import { DeveloperCredit } from "./developer-credit";

import { cn } from "@/lib/utils";
import { useAuth, dashboardPathFor, type AppRole } from "@/hooks/use-auth";
import { useMarkNotificationsRead, useNotifications } from "@/lib/api";
import { formatDateTime } from "@/lib/orders";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type RoleLabel = "Hóspede" | "Proprietário" | "Administrador" | "Administração";
const ROLE_ACCESS: Record<RoleLabel, AppRole[]> = { "Hóspede": ["guest", "admin"], "Proprietário": ["host", "admin"], "Administrador": ["admin"], "Administração": ["admin"] };

interface Props { title: string; subtitle?: string; role: RoleLabel; userName?: string; nav: NavItem[]; logoutTo: string; children: ReactNode; }

export function DashboardShell({ title, subtitle, role, nav, logoutTo, children }: Props) {
  const [open, setOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const accessWarningShown = useRef(false);
  const lastNotificationId = useRef<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, role: userRole, loading, signOut } = useAuth();
  const userName = profile?.full_name?.trim() || user?.email || "Minha conta";
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrowserPermission("Notification" in window ? window.Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (userRole !== "admin" || !notifications.length) return;
    const newest = notifications[0];
    if (!lastNotificationId.current) {
      lastNotificationId.current = newest.id;
      return;
    }
    if (lastNotificationId.current === newest.id) return;
    lastNotificationId.current = newest.id;
    if (browserPermission === "granted" && typeof window !== "undefined") {
      try { new window.Notification(newest.title, { body: newest.body || "Há uma nova movimentação na Zelo.", icon: "/favicon.png", tag: `zelo-${newest.id}` }); } catch { /* browser may block notifications */ }
    }
  }, [notifications, userRole, browserPermission]);

  const requestBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) { toast.error("Este navegador não oferece notificações web."); return; }
    const permission = await window.Notification.requestPermission();
    setBrowserPermission(permission);
    if (permission === "granted") toast.success("Notificações ativadas neste dispositivo.");
    else if (permission === "denied") toast.error("O navegador bloqueou as notificações. Você pode liberar nas configurações do site.");
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: logoutTo }); return; }
    const allowedRoles = ROLE_ACCESS[role];
    if (userRole && allowedRoles && !allowedRoles.includes(userRole)) {
      if (!accessWarningShown.current) { accessWarningShown.current = true; toast.error("Acesso não permitido", { description: "Esta área não está disponível para o papel da sua conta." }); }
      navigate({ to: dashboardPathFor(userRole), replace: true });
    }
  }, [loading, user, userRole, role, navigate, logoutTo]);

  const isAllowed = !!userRole && ROLE_ACCESS[role].includes(userRole);
  if (loading || !user || !isAllowed) return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Verificando acesso…</div>;

  const handleLogout = async () => { try { await signOut(); } catch { localStorage.clear(); sessionStorage.clear(); } navigate({ to: logoutTo || "/", replace: true }); };
  const NavList = ({ onNav }: { onNav?: () => void }) => <nav className="flex flex-col gap-1 px-3">{nav.map((item) => { const active = pathname === item.to; const Icon = item.icon; return <Link key={item.to} to={item.to} onClick={onNav} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="h-4 w-4 shrink-0" /><span className="truncate">{item.label}</span></Link>; })}<button type="button" onClick={() => { onNav?.(); void handleLogout(); }} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10 cursor-pointer"><LogOut className="h-4 w-4" />Sair da Conta</button></nav>;
  const Sidebar = <aside className="flex h-full w-64 flex-col border-r bg-sidebar"><div className="flex h-16 items-center px-5 border-b"><Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"><img src="/zelo-logo.png" alt="Zelo Logo" className="h-8 w-auto object-contain rounded" /><span className="font-serif font-bold text-lg tracking-wider text-foreground">Zelo</span></Link></div><div className="flex-1 overflow-y-auto py-4"><div className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{role}</div><NavList onNav={() => setOpen(false)} /></div><div className="border-t p-4 text-[11px] leading-relaxed text-muted-foreground"><div>© {new Date().getFullYear()} Zelo Concierge e Hospitalidade</div></div></aside>;

  return <div className="flex min-h-screen w-full bg-background"><div className="hidden lg:block">{Sidebar}</div><div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-6"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="left" className="w-72 p-0"><SheetHeader className="sr-only"><SheetTitle>Menu Zelo</SheetTitle></SheetHeader>{Sidebar}</SheetContent></Sheet><div className="min-w-0 flex-1"><h1 className="truncate font-serif text-base font-semibold sm:text-xl">{title}</h1>{subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}</div><Popover onOpenChange={(o) => { if (o && unread > 0) markRead.mutate(); }}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative shrink-0"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground">{unread}</span>}</Button></PopoverTrigger><PopoverContent align="end" className="w-[min(21rem,calc(100vw-2rem))] p-0"><div className="border-b px-4 py-3 font-semibold">Notificações</div>{userRole === "admin" && <div className="border-b px-4 py-3"><Button variant="outline" size="sm" className="w-full gap-2" onClick={() => void requestBrowserNotifications()} disabled={browserPermission === "granted"}><Smartphone className="h-4 w-4" />{browserPermission === "granted" ? "Notificações deste dispositivo ativas" : browserPermission === "denied" ? "Notificações bloqueadas no navegador" : "Ativar notificações neste dispositivo"}</Button><p className="mt-2 text-[11px] text-muted-foreground">Autorize o navegador para receber um aviso quando houver uma nova movimentação.</p></div>}<div className="max-h-80 overflow-y-auto divide-y">{notifications.length === 0 ? <div className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div> : notifications.map((n) => <div key={n.id} className={cn("px-4 py-3", !n.read_at && "bg-accent/40")}><div className="text-sm font-medium">{n.title}</div>{n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}<div className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(n.created_at)}</div></div>)}</div></PopoverContent></Popover><div className="flex shrink-0 items-center gap-2 pl-1 sm:pl-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{userName.split(" ").slice(0, 2).map((s) => s[0]).join("")}</AvatarFallback></Avatar><div className="hidden sm:block"><div className="max-w-[12rem] truncate text-sm font-medium leading-tight">{userName}</div><div className="text-xs text-muted-foreground leading-tight">{role}</div></div><Button variant="ghost" size="sm" onClick={() => void handleLogout()} className="text-xs text-muted-foreground hover:text-destructive gap-1 px-2" title="Sair da conta"><LogOut className="h-3.5 w-3.5" /><span className="hidden md:inline">Sair</span></Button></div></header><main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main><footer className="border-t px-4 py-3 text-center text-[11px] text-muted-foreground sm:px-6 lg:px-8"><DeveloperCredit className="text-primary" /></footer></div><WhatsappButton /></div>;
}
