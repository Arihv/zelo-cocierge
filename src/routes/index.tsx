import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeveloperCredit } from "@/components/developer-credit";
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  ArrowRight, 
  User, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Building2 
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const WHATSAPP_LINK = "https://wa.me/message/GB3V6CVQGZULC1";

export function IndexPage() {
  return (
    <div className="min-h-screen bg-[#081f19] text-[#f4efe6] flex flex-col justify-between selection:bg-[#d8b872] selection:text-black relative overflow-x-hidden">
      {/* Luzes Nobres de Fundo (Glow Ambiente) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#133d32]/40 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#c6a35d]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Superior Translúcido */}
      <header className="border-b border-[#c6a35d]/15 bg-[#081f19]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/zelo-logo.png" 
              alt="Zelo Logo" 
              className="h-11 w-11 object-contain rounded-xl border border-[#c6a35d]/30 shadow-md bg-[#0a261f]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-serif tracking-[0.25em] text-lg font-semibold text-[#e8d5a7]">ZELO</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão Área do Proprietário Translúcido e Harmonioso */}
            <Link to="/proprietario/login">
              <button
                type="button"
                className="bg-[#0b2b23]/80 hover:bg-[#10382e] border border-[#c6a35d]/40 text-[#e8d5a7] hover:text-white rounded-full px-5 py-2 text-xs sm:text-sm font-medium transition-all shadow-sm backdrop-blur-sm flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4 text-[#d8b872]" /> Área do Proprietário
              </button>
            </Link>
            <Link to="/admin/login">
              <Button variant="ghost" className="text-xs text-stone-400 hover:text-[#e8d5a7] flex items-center gap-1">
                <Lock className="h-3 w-3" /> Operação
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Seção Principal */}
      <main className="flex-1 w-full py-12 md:py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Logo Centralizada */}
          <div className="mb-8 relative flex justify-center">
            <div className="absolute inset-0 bg-[#d8b872]/15 rounded-3xl blur-2xl transform scale-90" />
            <div className="relative inline-block p-1 rounded-3xl bg-[#0a261f] shadow-2xl border border-[#c6a35d]/30">
              <img 
                src="/zelo-logo.png" 
                alt="Zelo Concierge & Hospitality" 
                className="h-40 w-40 md:h-48 md:w-48 object-cover rounded-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&auto=format&fit=crop&q=80";
                }}
              />
            </div>
          </div>

          {/* Título e Tagline */}
          <div className="space-y-4 max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10382e]/80 border border-[#c6a35d]/25 text-xs font-medium uppercase tracking-[0.2em] text-[#e8d5a7]">
              <Sparkles className="h-3.5 w-3.5 text-[#d8b872]" /> Concierge & Hospitalidade
            </div>

            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-normal tracking-wide text-[#fdfbf7] leading-tight">
              Zelo Concierge e Hospitalidade
            </h1>

            <p className="text-stone-300 text-sm md:text-base font-light leading-relaxed max-w-xl mx-auto">
              Experiência de estadia personalizada, comodidades exclusivas e atendimento premium para seu conforto absoluto.
            </p>
          </div>

          {/* Card Principal: Portal do Hóspede */}
          <div className="w-full max-w-md">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#b38f46]/30 to-[#e8d5a7]/20 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
              <Card className="relative bg-[#0c2b23]/90 border border-[#c6a35d]/35 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden text-white">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2 text-center">
                    <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#d8b872]">
                      Bem-vindo à sua estadia
                    </span>
                    <h2 className="font-serif text-2xl font-normal text-white">Área do Hóspede</h2>
                    <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
                      Solicite comodidades, kits de boas-vindas, mantas extras, mercado e acompanhe seus pedidos em tempo real.
                    </p>
                  </div>

                  <Link to="/hospede/login" className="block w-full">
                    {/* Botão em Tom Creme com Sombra Escura */}
                    <button
                      type="button"
                      className="w-full h-12 text-[#2a210d] font-semibold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all cursor-pointer relative overflow-hidden border border-[#ede3cf] active:scale-[0.99] hover:brightness-105 flex items-center justify-center gap-2"
                      style={{
                        background: "linear-gradient(180deg, #f7eed9 0%, #ecdcb9 45%, #dbc69b 100%)",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      <span className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10 flex items-center gap-2">
                        Acessar minha estadia <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* 3 Cartões de Diferenciais */}
        <section className="mt-20 w-full px-6">
          <p className="text-center text-xs text-stone-400 mb-8 font-light tracking-wide">
            Cada área possui acesso restrito e seguro por autenticação.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-[#0c2b23]/60 border border-[#c6a35d]/20 backdrop-blur-sm hover:border-[#c6a35d]/40 transition-all duration-300 hover:-translate-y-1 text-left space-y-3">
              <div className="p-3 rounded-xl bg-[#133d32]/70 border border-[#c6a35d]/20 w-fit">
                <Sparkles className="h-5 w-5 text-[#e8d5a7]" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#fdfbf7]">Serviços Sob Medida</h3>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                Limpezas personalizadas por tipologia (S, D, T), enxoval térmico e reposição rápida para seu imóvel.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-[#0c2b23]/60 border border-[#c6a35d]/20 backdrop-blur-sm hover:border-[#c6a35d]/40 transition-all duration-300 hover:-translate-y-1 text-left space-y-3">
              <div className="p-3 rounded-xl bg-[#133d32]/70 border border-[#c6a35d]/20 w-fit">
                <ShieldCheck className="h-5 w-5 text-[#e8d5a7]" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#fdfbf7]">Confiança em Cada Etapa</h3>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                Atendimento dedicado via WhatsApp da Zelo e pagamento integrado com total segurança.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-[#0c2b23]/60 border border-[#c6a35d]/20 backdrop-blur-sm hover:border-[#c6a35d]/40 transition-all duration-300 hover:-translate-y-1 text-left space-y-3">
              <div className="p-3 rounded-xl bg-[#133d32]/70 border border-[#c6a35d]/20 w-fit">
                <Building2 className="h-5 w-5 text-[#e8d5a7]" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#fdfbf7]">Gestão Completa</h3>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                Acompanhamento em tempo real para que proprietários e hóspedes tenham suporte de alto padrão.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé com Contatos e Assinatura */}
      <footer className="border-t border-[#c6a35d]/15 bg-[#051511] py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a 
              href="mailto:zeloconciergeria@gmail.com" 
              className="flex items-center gap-1.5 hover:text-[#e8d5a7] transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-[#d8b872]" /> zeloconciergeria@gmail.com
            </a>
            <a 
              href="tel:48991654462" 
              className="flex items-center gap-1.5 hover:text-[#e8d5a7] transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-[#d8b872]" /> (48) 9 9165 4462
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 text-stone-500">
            <span>© 2026 Zelo Concierge e Hospitalidade — todos os direitos reservados.</span>
            <span className="hidden sm:inline">•</span>
            <DeveloperCredit className="text-[#e8d5a7]" />
          </div>
        </div>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba57] text-white px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105"
      >
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="font-semibold text-sm">Atendimento</span>
      </a>
    </div>
  );
}
