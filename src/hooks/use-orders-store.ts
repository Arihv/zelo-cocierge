import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

type DbCategory = Database["public"]["Enums"]["order_category"];
type DbStatus = Database["public"]["Enums"]["order_status"];
export interface OrderItem {
  id: string;
  solicitante: string;
  perfil: "Hóspede" | "Proprietário" | "Administrador";
  categoria: "Serviços" | "Minimercado" | "Kits" | "Manutenção";
  imovel: string;
  itens: string;
  valor: string;
  status: "Recebido" | "Em Preparação" | "Entregue" | "Cancelado";
  metodo_pagamento?: string;
  observacoes?: string;
  data?: string;
  created_at?: string;
}

const categoryFor = (category: OrderItem["categoria"]): DbCategory =>
  ({ Kits: "kit", Minimercado: "mercado", Manutenção: "manutencao", Serviços: "servico" })[
    category
  ];
const statusFor = (status: OrderItem["status"]): DbStatus =>
  ({
    Recebido: "recebido",
    "Em Preparação": "em_preparacao",
    Entregue: "concluido",
    Cancelado: "cancelado",
  })[status];
const labelFor = (status: DbStatus): OrderItem["status"] =>
  status === "concluido"
    ? "Entregue"
    : status === "cancelado"
      ? "Cancelado"
      : status === "em_preparacao"
        ? "Em Preparação"
        : "Recebido";
const parseAmount = (value: string) =>
  Number(value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
const serialize = (order: Omit<OrderItem, "id" | "data" | "created_at">) =>
  JSON.stringify({
    solicitante: order.solicitante,
    perfil: order.perfil,
    imovel: order.imovel,
    itens: order.itens,
    metodo_pagamento: order.metodo_pagamento,
    observacoes: order.observacoes,
  });

function deserialize(row: Database["public"]["Tables"]["orders"]["Row"]): OrderItem {
  let details: Record<string, string> = {};
  try {
    details = row.details ? JSON.parse(row.details) : {};
  } catch {
    details = { itens: row.details ?? "Solicitação" };
  }
  const categoria =
    row.category === "kit"
      ? "Kits"
      : row.category === "mercado"
        ? "Minimercado"
        : row.category === "manutencao"
          ? "Manutenção"
          : "Serviços";
  return {
    id: row.id,
    solicitante: details.solicitante || "Cliente",
    perfil: (details.perfil as OrderItem["perfil"]) || "Hóspede",
    categoria,
    imovel: details.imovel || "—",
    itens: details.itens || "Solicitação",
    valor: `R$ ${Number(row.total).toFixed(2).replace(".", ",")}`,
    status: labelFor(row.status),
    metodo_pagamento: details.metodo_pagamento,
    observacoes: details.observacoes,
    data: new Date(row.created_at).toLocaleDateString("pt-BR"),
    created_at: row.created_at,
  };
}

export function useOrdersStore() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setLoading(false);
      throw error;
    }
    setOrders(data.map(deserialize));
    setLoading(false);
  }, [user]);
  useEffect(() => {
    void fetchOrders().catch(console.error);
    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void fetchOrders().catch(console.error),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchOrders]);
  const addOrder = async (order: Omit<OrderItem, "id" | "data"> & { id?: string }) => {
    if (!user) throw new Error("Faça login para criar um pedido.");
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id, apartment_id")
      .eq("guest_id", user.id)
      .in("status", ["confirmada", "ativa"])
      .order("check_in", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (reservationError) throw reservationError;
    if (!reservation) {
      throw new Error("Vincule uma reserva ativa à sua conta antes de solicitar um serviço.");
    }
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        category: categoryFor(order.categoria),
        status: "recebido",
        total: parseAmount(order.valor),
        details: serialize(order),
        apartment_id: reservation.apartment_id,
        reservation_id: reservation.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    await fetchOrders();
    return data;
  };
  const updateOrderStatus = async (id: string, status: OrderItem["status"]) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: statusFor(status) })
      .eq("id", id);
    if (error) throw error;
    await fetchOrders();
  };
  const removeOrder = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
    await fetchOrders();
  };
  return { orders, loading, addOrder, updateOrderStatus, removeOrder, refreshOrders: fetchOrders };
}
