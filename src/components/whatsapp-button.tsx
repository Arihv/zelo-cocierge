import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";

/** Botão flutuante de atendimento — visível em todas as páginas. */
export function WhatsappButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Falar com a operação no WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-success px-4 py-3 text-success-foreground shadow-elegant transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm font-medium sm:inline">Atendimento</span>
    </a>
  );
}
