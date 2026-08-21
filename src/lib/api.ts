import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { OrderCategory, OrderStatus } from "@/lib/orders";
import { propertyTypeFromCode, type PropertyType } from "@/lib/property";

export type ApartmentLite = {
  id: string;
  code: string | null;
  name: string;
  address: string;
  city: string;
  state: string | null;
};

export type ServiceRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: OrderCategory;
  audience: string;
  price_by_property: boolean;
  unit: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

export type PricingRow = {
  id: string;
  service_key: string;
  property_type: PropertyType | null;
  price: number;
};

export type ReservationRow = {
  id: string;
  apartment_id: string;
  guest_id: string | null;
  reservation_code: string;
  guest_name: string | null;
  guest_phone: string | null;
  address: string | null;
  check_in: string;
  check_out: string;
  status: string;
  created_at: string;
  apartments: ApartmentLite | null;
};

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  reservation_id: string | null;
  apartment_id: string | null;
  category: OrderCategory;
  status: OrderStatus;
  total: number;
  details: string | null;
  scheduled_for: string | null;
  created_at: string;
  apartments?: ApartmentLite | null;
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Catálogo de serviços (limpeza, organização, mantas, travesseiros, aquecedores...) */
export function useServices(audience?: "guest" | "host") {
  return useQuery({
    queryKey: ["services", audience ?? "all"],
    queryFn: async () => {
      let q = supabase.from("service_catalog").select("*").eq("is_active", true).order("sort_order");
  // "all" is managed by the administration for services that must be visible
  // to both guests and property owners.
  if (audience) q = q.in("audience", [audience, "all"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ServiceRow[];
    },
  });
}

export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as PricingRow[];
    },
  });
}

/** Preço de um serviço considerando o tipo do imóvel (primeira letra do código). */
export function priceFor(pricing: PricingRow[], serviceKey: string, code?: string | null): number {
  const type = propertyTypeFromCode(code);
  const typed = pricing.find((p) => p.service_key === serviceKey && p.property_type === type);
  if (typed) return Number(typed.price);
  const flat = pricing.find((p) => p.service_key === serviceKey && p.property_type === null);
  return flat ? Number(flat.price) : 0;
}

/** Hospedagem vinculada ao hóspede logado. */
export function useMyReservation() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-reservation", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, apartments(id, code, name, address, city, state)")
        .eq("guest_id", user!.id)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ReservationRow | null;
    },
  });
}

export function useLinkReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("link_reservation", { _code: code });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-reservation"] });
    },
  });
}

export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, apartments(id, code, name, address, city, state)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
}

/** Pedidos relacionados aos imóveis do proprietário (inclui os próprios). */
export function useOwnerOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", "owner", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, apartments(id, code, name, address, city, state)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, apartments(id, code, name, address, city, state)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
}

export function useReservations() {
  return useQuery({
    queryKey: ["reservations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, apartments(id, code, name, address, city, state)")
        .order("check_in", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ReservationRow[];
    },
  });
}

export function useApartments(hostOnly = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["apartments", hostOnly ? user?.id : "all"],
    queryFn: async () => {
      let q = supabase.from("apartments").select("id, code, name, address, city, state, host_id, daily_rate, is_active");
      if (hostOnly && user) q = q.eq("host_id", user.id);
      const { data, error } = await q.order("code");
      if (error) throw error;
      return (data ?? []) as unknown as (ApartmentLite & { host_id: string; is_active: boolean; daily_rate: number })[];
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export type NewOrder = {
  category: OrderCategory;
  total: number;
  details?: string;
  apartmentId?: string | null;
  reservationId?: string | null;
  scheduledFor?: string | null;
  items?: { name: string; quantity: number; unit_price: number; service_key?: string }[];
};

export function useCreateOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewOrder) => {
      if (!user) throw new Error("Faça login para continuar.");
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          category: input.category,
          total: input.total,
          details: input.details ?? null,
          apartment_id: input.apartmentId ?? null,
          reservation_id: input.reservationId ?? null,
          scheduled_for: input.scheduledFor ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      const order = data as unknown as OrderRow;
      if (input.items?.length) {
        const { error: itemsError } = await supabase.from("order_items").insert(
          input.items.map((i) => ({
            order_id: order.id,
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            service_key: i.service_key ?? null,
          })),
        );
        if (itemsError) throw itemsError;
      }
      return order;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function usePartners() {
  return useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        name: string;
        segment: string | null;
        benefit: string | null;
        description: string | null;
        contact: string | null;
        website: string | null;
        is_active: boolean;
      }[];
    },
  });
}

export function useOrderItems(orderId?: string | null) {
  return useQuery({
    queryKey: ["order-items", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId!);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; name: string; quantity: number; unit_price: number }[];
    },
  });
}
