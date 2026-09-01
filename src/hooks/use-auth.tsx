import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "guest" | "host" | "admin";
export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  cpf: string | null;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (opts: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    cpf?: string;
    role: "guest" | "host";
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;

  const loadIdentity = async (activeSession: Session | null) => {
    if (!activeSession) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, cpf")
        .eq("id", activeSession.user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", activeSession.user.id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (roleResult.error) throw roleResult.error;
    setProfile(profileResult.data);
    setRole((roleResult.data?.role as AppRole | undefined) ?? null);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session);
      await loadIdentity(data.session);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadIdentity(nextSession).catch(() => {
        setProfile(null);
        setRole(null);
      });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Alterações de papel feitas pela administração precisam valer também para
  // quem já estava logado em outro dispositivo ou aba.
  useEffect(() => {
    if (!user?.id) return;

    const refreshIdentity = () => void refresh();
    const channel = supabase
      .channel(`identity-role-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        refreshIdentity,
      )
      .subscribe();

    window.addEventListener("focus", refreshIdentity);
    return () => {
      window.removeEventListener("focus", refreshIdentity);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      profile,
      role,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return { error: error?.message ?? null };
      },
      signUp: async ({ email, password, fullName, phone, cpf, role: requestedRole }) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName, phone: phone ?? "", cpf: cpf ?? "", role: requestedRole } },
        });
        if (error) return { error: error.message };
        if (data.session) await loadIdentity(data.session);
        return { error: null };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
        setProfile(null);
        setRole(null);
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        return { error: error?.message ?? null };
      },
      refresh,
    }),
    [user, session, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
export function dashboardPathFor(role: AppRole | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "host") return "/proprietario/dashboard";
  if (role === "guest") return "/hospede/dashboard";
  return "/";
}
