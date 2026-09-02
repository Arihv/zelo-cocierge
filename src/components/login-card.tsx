import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { dashboardPathFor, useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { User, MessageCircle } from "lucide-react";
import { DeveloperCredit } from "./developer-credit";

export type RoleLabel = "Hóspede" | "Proprietário" | "Administração" | "Administrador";

const LABEL_TO_ROLE: Record<RoleLabel, AppRole> = {
  "Hóspede": "guest",
  "Proprietário": "host",
  "Administração": "admin",
  "Administrador": "admin",
};

const DEFAULT_TITLES: Record<RoleLabel, string> = {
  "Proprietário": "Gestão elegante para cada apartamento.",
  "Hóspede": "Comodidades exclusivas para a sua estadia.",
  "Administração": "Gestão e controle operacional da plataforma.",
  "Administrador": "Gestão e controle operacional da plataforma.",
};

const WHATSAPP_LINK = "https://wa.me/5548991654462";

export function LoginCard({
  role,
  redirectTo,
  accentText,
  allowSignup = true,
}: {
  role: RoleLabel;
  redirectTo: string;
  accentText?: string;
  allowSignup?: boolean;
}) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const expectedRole = LABEL_TO_ROLE[role];
  const titleText = accentText || DEFAULT_TITLES[role];

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);

    if (rememberMe) {
      localStorage.setItem("estadia_remember_me", "true");
    } else {
      localStorage.removeItem("estadia_remember_me");
      sessionStorage.setItem("estadia_session_active", "true");
    }

    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    let actualRole: AppRole | null = null;
    if (user) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      actualRole = (roleRow?.role as AppRole | undefined) ?? null;
    }

    toast.success("Bem-vindo(a) de volta!");
    navigate({ to: actualRole ? dashboardPathFor(actualRole) : redirectTo, replace: true });
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "");
    const phone = String(form.get("phone") ?? "");
    const cpf = String(form.get("cpf") ?? "").replace(/\D/g, "");
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setBusy(true);
    const { error } = await signUp({
      email,
      password,
      fullName,
      phone,
      cpf,
      role: expectedRole === "host" ? "host" : "guest",
    });
    setBusy(false);
    if (error) {
      toast.error("Falha no cadastro", { description: error });
      return;
    }
    toast.success("Conta criada!", { description: "Abra o e-mail de confirmação para ativar a conta. Depois você será direcionado à Zelo." });
    setTab("signin");
    (e.currentTarget as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-[#d8b872] selection:text-black">
      
      {/* 1. Divisão Bicolor dos Dois Tons de Verde */}
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2 pointer-events-none z-0">
        <div className="bg-[#03150f] w-full h-full" />
        <div className="bg-[#08221a] w-full h-full" />
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1550px] grid-cols-1 items-center lg:grid-cols-2">
        
        {/* LADO ESQUERDO: Apresentação */}
        <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden p-6 text-[#f4efe6] sm:min-h-[640px] sm:p-14 lg:h-full lg:p-20">
          
          {/* Blur Dourado Suave Posicionado Diretamente Atrás do Texto */}
          <div 
            className="absolute top-1/2 left-[48%] -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none -z-10"
            style={{
              background: "radial-gradient(circle, rgba(216, 178, 98, 0.20) 0%, rgba(155, 118, 48, 0.07) 45%, rgba(3, 21, 15, 0) 70%)",
              filter: "blur(60px)",
            }}
          />

          {/* Topo: Logo ZELO */}
          <Link to="/" className="relative z-10 flex items-center gap-3.5 w-fit hover:opacity-90 transition-opacity">
            <img
              src="/zelo-logo.png"
              alt="Zelo Logo"
              className="h-11 w-11 object-contain rounded-xl border border-[#c6a35d]/30 shadow-md bg-[#0a261f]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-serif tracking-[0.35em] text-xl font-semibold text-[#e8d5a7]">ZELO</span>
          </Link>

          {/* Bloco Central de Textos */}
          <div className="relative z-10 my-auto py-10 max-w-lg space-y-6 text-left">
            {/* Tag Pílula */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6a35d]/35 bg-[#092b21]/70 px-4 py-1.5 text-[11px] font-normal tracking-wide text-[#e8d5a7] backdrop-blur-md">
              <User className="h-3 w-3 text-[#d8b872]" />
              Área do {role === "Administração" ? "Operacional" : role}
            </div>

            {/* Título Principal */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[45px] font-normal leading-[1.18] text-[#ffffff] tracking-tight">
              {titleText}
            </h1>

            {/* Descrição */}
            <p className="text-sm sm:text-[15px] text-stone-300 font-light leading-relaxed max-w-md">
              Uma experiência premium e integrada para gerenciar sua estadia, serviços e pedidos com total conforto e sofisticação.
            </p>
          </div>

          {/* Rodapé Inferior Desktop */}
          <div className="relative z-10 hidden lg:flex items-center gap-3 text-xs text-stone-400 font-light whitespace-nowrap">
            <span>© 2026 Zelo Concierge e Hospitalidade — todos os direitos reservados</span>
            <span className="text-[#c6a35d]/40">|</span>
            <span className="inline-flex items-center gap-1.5 text-[#e8d5a7]">
              <DeveloperCredit />
            </span>
          </div>
        </div>

        {/* LADO DIREITO: Cartão Flutuante */}
        <div className="relative flex items-center justify-center p-4 sm:p-10 lg:h-full lg:p-16">
          <div className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-[#e8d5a7]/30 bg-[#fbf9f4] p-6 text-stone-900 shadow-[0_25px_60px_rgba(0,0,0,0.45)] sm:rounded-[30px] sm:p-10">
            
            {/* Cabeçalho do Card */}
            <div className="text-left space-y-1">
              <h2 className="font-serif text-2xl sm:text-[28px] font-normal text-stone-900">
                Acessar como {role}
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-500 font-light">
                {allowSignup
                  ? "Entre ou crie sua conta para continuar."
                  : "Informe suas credenciais para continuar."}
              </p>
            </div>

            {allowSignup ? (
              <div className="mt-6">
                {/* Abas Pílula Bege com Borda Dourada */}
                <div className="grid grid-cols-2 bg-[#ece6dc] p-1 rounded-full h-11 border border-[#d8b872]/40 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className={`rounded-full text-xs sm:text-[13px] font-medium transition-all h-9 flex items-center justify-center cursor-pointer ${
                      tab === "signin"
                        ? "bg-white text-stone-900 shadow-md border border-[#d8b872]/30"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className={`rounded-full text-xs sm:text-[13px] font-medium transition-all h-9 flex items-center justify-center cursor-pointer ${
                      tab === "signup"
                        ? "bg-white text-stone-900 shadow-md border border-[#d8b872]/30"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Criar conta
                  </button>
                </div>

                {/* Formulário: Entrar */}
                {tab === "signin" && (
                  <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs text-stone-600 font-normal">E-mail</label>
                      <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="seu.email@exemplo.com"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#c6a35d] text-sm shadow-inner shadow-stone-50"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs text-stone-600 font-normal">Senha</label>
                      <input
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#c6a35d] text-sm shadow-inner shadow-stone-50"
                      />
                    </div>

                    {/* Checkbox Circular */}
                    <div className="flex items-center gap-2 pt-1 pb-1 text-left">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-full border-stone-300 text-[#10382e] focus:ring-[#c6a35d] cursor-pointer appearance-none checked:bg-[#c6a35d] checked:border-transparent border bg-white flex items-center justify-center transition-all"
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-stone-500 font-light cursor-pointer select-none"
                      >
                        Salvar meu acesso neste dispositivo
                      </label>
                    </div>

                    {/* Botão ACESSAR CONTA em Creme Luminoso com Sombra Escura */}
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full h-12 text-[#2a210d] font-semibold text-xs sm:text-[13px] tracking-wider uppercase rounded-xl transition-all mt-2 cursor-pointer relative overflow-hidden border border-[#ede3cf] active:scale-[0.99] hover:brightness-105"
                      style={{
                        background: "linear-gradient(180deg, #f7f1e3 0%, #ecdcb9 45%, #dfcaa0 100%)",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.24), 0 4px 10px rgba(16, 56, 46, 0.16)",
                      }}
                    >
                      <span className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10">{busy ? "Entrando..." : "ACESSAR CONTA"}</span>
                    </button>
                  </form>
                )}

                {/* Formulário: Criar Conta */}
                {tab === "signup" && (
                  <form onSubmit={handleSignUp} className="mt-6 space-y-3.5">
                    <div className="space-y-1 text-left">
                      <label className="text-xs text-stone-600 font-normal">Nome completo</label>
                      <input
                        name="fullName"
                        required
                        placeholder="Seu nome"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#c6a35d]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-xs text-stone-600 font-normal">CPF</label>
                        <input
                          name="cpf"
                          inputMode="numeric"
                          required
                          placeholder="000.000.000-00"
                          className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#c6a35d]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-stone-600 font-normal">Telefone</label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="(48) 9..."
                          className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#c6a35d]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-xs text-stone-600 font-normal">E-mail</label>
                        <input
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="email@exemplo.com"
                          className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#c6a35d]"
                        />
                      </div>
                    <div className="space-y-1 text-left">
                      <label className="text-xs text-stone-600 font-normal">Senha</label>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#c6a35d]"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full h-12 text-[#2a210d] font-semibold text-xs sm:text-[13px] tracking-wider uppercase rounded-xl transition-all mt-2 cursor-pointer relative overflow-hidden border border-[#ede3cf] active:scale-[0.99] hover:brightness-105"
                      style={{
                        background: "linear-gradient(180deg, #f7f1e3 0%, #ecdcb9 45%, #dfcaa0 100%)",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.24), 0 4px 10px rgba(16, 56, 46, 0.16)",
                      }}
                    >
                      <span className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10">{busy ? "Criando..." : "CRIAR CONTA"}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Formulário Direto (Administração) */
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-stone-600 font-normal">E-mail</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu.email@exemplo.com"
                    className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#c6a35d] text-sm"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-stone-600 font-normal">Senha</label>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full h-11 px-4 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#c6a35d] text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 pb-1 text-left">
                  <input
                    type="checkbox"
                    id="remember-me-direct"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-full border-stone-300 text-[#10382e] focus:ring-[#c6a35d] cursor-pointer appearance-none checked:bg-[#c6a35d] checked:border-transparent border bg-white flex items-center justify-center transition-all"
                  />
                  <label
                    htmlFor="remember-me-direct"
                    className="text-xs text-stone-500 font-light cursor-pointer select-none"
                  >
                    Salvar meu acesso neste dispositivo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 text-[#2a210d] font-semibold text-xs sm:text-[13px] tracking-wider uppercase rounded-xl transition-all mt-2 cursor-pointer relative overflow-hidden border border-[#ede3cf] active:scale-[0.99] hover:brightness-105"
                  style={{
                    background: "linear-gradient(180deg, #f7f1e3 0%, #ecdcb9 45%, #dfcaa0 100%)",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.24), 0 4px 10px rgba(16, 56, 46, 0.16)",
                  }}
                >
                  <span className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-xl" />
                  <span className="relative z-10">{busy ? "Entrando..." : "ACESSAR CONTA"}</span>
                </button>
              </form>
            )}

            {/* Links Auxiliares */}
            <div className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-stone-500 font-light">
              <Link to="/recuperar-senha" className="hover:text-stone-900 transition-colors">
                Esqueci minha senha
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-normal transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#b38f46]" /> Falar com a operação no WhatsApp
              </a>
              <Link to="/" className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors pt-1">
                ← Voltar para o início
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Mobile */}
      <div className="lg:hidden p-6 text-center text-xs text-stone-400 space-y-1 border-t border-[#c6a35d]/15 bg-[#03140f]">
        <div>© 2026 Zelo Concierge e Hospitalidade</div>
        <DeveloperCredit className="text-[#e8d5a7]" />
      </div>
    </div>
  );
}
