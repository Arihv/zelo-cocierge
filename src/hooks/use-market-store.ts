import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketProduct { id: string; name: string; category: string; price: number; stock: number; }

export const MARKET_CATEGORIES = ["Bebidas", "Laticínios", "Frios e Ovos", "Grãos e Massas", "Mercearia", "Snacks e Doces", "Padaria e Matinais"];

export function useMarketStore() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("products").select("id, name, category, price, stock").order("name");
    if (error) {
      console.error("Erro ao buscar produtos:", error);
      setProducts([]);
    } else {
      setProducts((data ?? []).map((product: MarketProduct) => ({ ...product, price: Number(product.price), stock: Number(product.stock) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshProducts();
    const channel = supabase
      .channel("products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => void refreshProducts())
      .subscribe();
    const interval = window.setInterval(() => void refreshProducts(), 30_000);
    const refreshOnFocus = () => void refreshProducts();
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      void supabase.removeChannel(channel);
    };
  }, [refreshProducts]);

  const createProduct = async (product: Omit<MarketProduct, "id">) => {
    const payload = { ...product, id: crypto.randomUUID(), price: Number(product.price), stock: Math.max(0, Number(product.stock)) };
    const { error } = await (supabase as any).from("products").insert(payload);
    if (error) throw error;
  };
  const updateProduct = async (id: string, changes: Partial<Omit<MarketProduct, "id">>) => {
    const { error } = await (supabase as any).from("products").update(changes).eq("id", id);
    if (error) throw error;
  };
  const deleteProduct = async (id: string) => {
    const { error } = await (supabase as any).from("products").delete().eq("id", id);
    if (error) throw error;
  };
  const updateProductStock = async (id: string, stock: number) => updateProduct(id, { stock: Math.max(0, stock) });

  return useMemo(() => ({
    products, loading, categories: MARKET_CATEGORIES,
    refreshProducts, createProduct, updateProduct, deleteProduct, updateProductStock,
  }), [products, loading, refreshProducts]);
}
