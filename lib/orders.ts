export const orderStatuses = [
  "recebido",
  "em_analise",
  "confirmado",
  "em_preparacao",
  "em_entrega",
  "concluido",
  "cancelado",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  confirmado: "Confirmado",
  em_preparacao: "Em preparação",
  em_entrega: "Em entrega",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const orderCategories = [
  "kit",
  "mercado",
  "limpeza",
  "organizacao",
  "servico",
  "manutencao",
  "operacional",
] as const;

export type OrderCategory = (typeof orderCategories)[number];

export const orderCategoryLabels: Record<OrderCategory, string> = {
  kit: "Kits",
  mercado: "Mercado",
  limpeza: "Limpeza",
  organizacao: "Organização",
  servico: "Serviços",
  manutencao: "Manutenção",
  operacional: "Operacional",
};

export const reservationStatusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  ativa: "Ativa",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export function statusTone(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "concluido") return "default";
  if (status === "cancelado") return "destructive";
  if (status === "recebido" || status === "em_analise") return "outline";
  return "secondary";
}

export function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Resume os itens de um pedido em texto legível, priorizando os itens
 * cadastrados em order_items. Para chamados de manutenção (que não têm
 * itens), usa a descrição registrada em `details`.
 */
export function orderItemsSummary(order: {
  category: OrderCategory;
  details: string | null;
  order_items?: { name: string; quantity: number }[] | null;
}): string {
  if (order.order_items && order.order_items.length > 0) {
    return order.order_items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
  }
  if (order.category === "manutencao") {
    try {
      const details = order.details ? JSON.parse(order.details) : {};
      if (typeof details.descricao === "string" && details.descricao) return details.descricao;
      if (typeof details.categoria === "string" && details.categoria) return `Chamado: ${details.categoria}`;
    } catch {
      // details pode não ser um JSON válido; segue para o rótulo padrão.
    }
    return "Chamado de manutenção";
  }
  return orderCategoryLabels[order.category];
}
