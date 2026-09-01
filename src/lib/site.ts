/** Contato central da operação — usado no botão flutuante e nos links de atendimento. */
export const WHATSAPP_NUMBER = "5548991654462";

export function whatsappLink(message = "Olá! Preciso de ajuda com a minha hospedagem.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_DISPLAY = "(48) 99165-4462";
