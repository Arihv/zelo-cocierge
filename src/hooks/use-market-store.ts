import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  options?: string | null;
}

export const MARKET_CATEGORIES = ["Bebidas", "Laticínios", "Frios e Ovos", "Grãos e Massas", "Mercearia", "Snacks e Doces", "Padaria e Matinais", "Higiene e Limpeza"];

export function useMarketStore() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(MARKET_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, categoriesResult] = await Promise.all([
      (supabase as any).from("products").select("id, name, category, price, stock, options").order("name"),
      (supabase as any).from("market_categories").select("name, sort_order").order("sort_order").order("name"),
    ]);
    if (error) {
      console.error("Erro ao buscar produtos:", error);
      setProducts([]);
    } else {
      setProducts((data ?? []).map((product: MarketProduct) => ({ ...product, price: Number(product.price), stock: Number(product.stock) })));
    }
    if (!categoriesResult.error && categoriesResult.data?.length) {
      setCategories(categoriesResult.data.map((row: { name: string }) => row.name));
    } else {
      const fromProducts = [...new Set((data ?? []).map((row: MarketProduct) => row.category).filter(Boolean))] as string[];
      setCategories(fromProducts.length ? fromProducts.sort() : MARKET_CATEGORIES);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshProducts();
    const productsChannel = supabase.channel("products-live").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => void refreshProducts()).subscribe();
    const categoriesChannel = supabase.channel("market-categories-live").on("postgres_changes", { event: "*", schema: "public", table: "market_categories" }, () => void refreshProducts()).subscribe();
    const interval = window.setInterval(() => void refreshProducts(), 30_000);
    const refreshOnFocus = () => void refreshProducts();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      void supabase.removeChannel(productsChannel);
      void supabase.removeChannel(categoriesChannel);
    };
  }, [refreshProducts]);

  const createProduct = async (product: Omit<MarketProduct, "id">) => {
    const payload = { ...product, id: crypto.randomUUID(), price: Number(product.price), stock: Math.max(0, Number(product.stock)), options: product.options?.trim() || null };
    const { error } = await (supabase as any).from("products").insert(payload);
    if (error) throw error;
  };
  const updateProduct = async (id: string, changes: Partial<Omit<MarketProduct, "id">>) => {
    const payload = { ...changes, ...(Object.hasOwn(changes, "options") ? { options: changes.options?.trim() || null } : {}) };
    const { error } = await (supabase as any).from("products").update(payload).eq("id", id);
    if (error) throw error;
  };
  const deleteProduct = async (id: string) => {
    const { error } = await (supabase as any).from("products").delete().eq("id", id);
    if (error) throw error;
  };
  const createCategory = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const { error } = await (supabase as any).from("market_categories").insert({ name: clean, sort_order: categories.length * 10 + 10 });
    if (error) throw error;
    await refreshProducts();
  };
  const deleteCategory = async (name: string) => {
    if (products.some((product) => product.category === name)) throw new Error("Mova os produtos desta categoria antes de excluí-la.");
    const { error } = await (supabase as any).from("market_categories").delete().eq("name", name);
    if (error) throw error;
    await refreshProducts();
  };
  const updateProductStock = async (id: string, stock: number) => updateProduct(id, { stock: Math.max(0, stock) });

  return useMemo(() => ({
    products, loading, categories,
    refreshProducts, createProduct, updateProduct, deleteProduct, updateProductStock, createCategory, deleteCategory,
  }), [products, loading, categories, refreshProducts]);
}
