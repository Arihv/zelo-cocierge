import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export const INITIAL_CATEGORIES = [
  "Bebidas",
  "Laticínios",
  "Frios e Ovos",
  "Grãos e Massas",
  "Mercearia",
  "Snacks e Doces",
  "Padaria e Matinais",
];

export const INITIAL_PRODUCTS: MarketProduct[] = [
  // Bebidas
  { id: "b1", name: "Cerveja Heineken 350 ml", category: "Bebidas", price: 7.9, stock: 12 },
  { id: "b2", name: "Cerveja Stella Artois 330 ml", category: "Bebidas", price: 8.9, stock: 12 },
  {
    id: "b3",
    name: "Chá branco com limão Matte Leão 450 ml",
    category: "Bebidas",
    price: 6.2,
    stock: 10,
  },
  { id: "b4", name: "Coca-Cola 1,5 Litro", category: "Bebidas", price: 11.9, stock: 15 },
  { id: "b5", name: "Coca-Cola 350 ml", category: "Bebidas", price: 5.9, stock: 20 },
  { id: "b6", name: "Coca-Cola 600 ml", category: "Bebidas", price: 7.5, stock: 15 },
  { id: "b7", name: "Guaraná Pureza 1 Litro", category: "Bebidas", price: 6.9, stock: 10 },
  {
    id: "b8",
    name: "Suco de uva integral Garibaldi 500 ml",
    category: "Bebidas",
    price: 10.9,
    stock: 8,
  },
  { id: "b9", name: "Suco natural de laranja 270 ml", category: "Bebidas", price: 6.9, stock: 10 },
  { id: "b10", name: "YoPRO 15g proteína 250 ml", category: "Bebidas", price: 10.9, stock: 8 },
  { id: "b11", name: "Água mineral 1 Litro", category: "Bebidas", price: 5.9, stock: 25 },
  { id: "b12", name: "Água mineral com gás 500 ml", category: "Bebidas", price: 3.9, stock: 30 },
  { id: "b13", name: "Água mineral sem gás 500 ml", category: "Bebidas", price: 3.5, stock: 30 },

  // Laticínios
  { id: "l1", name: "Cream Cheese 150g", category: "Laticínios", price: 13.9, stock: 10 },
  { id: "l2", name: "Creme de leite 200g", category: "Laticínios", price: 4.2, stock: 15 },
  { id: "l3", name: "Creme de ricota 200g", category: "Laticínios", price: 11.9, stock: 10 },
  { id: "l4", name: "Leite condensado 395g", category: "Laticínios", price: 7.5, stock: 12 },
  { id: "l5", name: "Leite desnatado 1 Litro", category: "Laticínios", price: 7.9, stock: 14 },
  { id: "l6", name: "Leite integral 1 Litro", category: "Laticínios", price: 6.5, stock: 20 },
  { id: "l7", name: "Leite zero lactose 1 Litro", category: "Laticínios", price: 8.9, stock: 10 },
  { id: "l8", name: "Manteiga 200g", category: "Laticínios", price: 8.5, stock: 12 },
  { id: "l9", name: "Margarina Qualy cremosa 250g", category: "Laticínios", price: 7.9, stock: 10 },
  { id: "l10", name: "Requeijão cremoso 180g", category: "Laticínios", price: 7.9, stock: 15 },

  // Frios e Ovos
  { id: "f1", name: "Queijo mussarela 150g", category: "Frios e Ovos", price: 10.9, stock: 12 },
  { id: "f2", name: "Queijo mussarela 300g", category: "Frios e Ovos", price: 21.9, stock: 8 },
  { id: "f3", name: "Queijo parmesão ralado 50g", category: "Frios e Ovos", price: 7.9, stock: 20 },
  { id: "f4", name: "Mortadela defumada 200g", category: "Frios e Ovos", price: 9.9, stock: 10 },
  { id: "f5", name: "Ovos 12 unidades", category: "Frios e Ovos", price: 14.9, stock: 15 },
  { id: "f6", name: "Ovos 6 unidades", category: "Frios e Ovos", price: 5.5, stock: 15 },
  { id: "f7", name: "Presunto defumado 200g", category: "Frios e Ovos", price: 11.9, stock: 10 },

  // Grãos e Massas
  { id: "g1", name: "Arroz 1kg", category: "Grãos e Massas", price: 5.99, stock: 25 },
  { id: "g2", name: "Arroz arbóreo 500g", category: "Grãos e Massas", price: 12.9, stock: 8 },
  { id: "g3", name: "Macarrão espaguete 500g", category: "Grãos e Massas", price: 6.9, stock: 20 },
  { id: "g4", name: "Macarrão penne 500g", category: "Grãos e Massas", price: 6.9, stock: 20 },
  { id: "g5", name: "Nhoque de batata 500g", category: "Grãos e Massas", price: 9.9, stock: 10 },
  { id: "g6", name: "Tapioca individual 70g", category: "Grãos e Massas", price: 1.99, stock: 30 },

  // Mercearia
  { id: "m1", name: "Azeite de oliva 250 ml", category: "Mercearia", price: 29.9, stock: 8 },
  { id: "m2", name: "Azeitona em conserva 80g", category: "Mercearia", price: 7.9, stock: 12 },
  { id: "m3", name: "Café 250g", category: "Mercearia", price: 20.9, stock: 15 },
  {
    id: "m4",
    name: "Geleia Queensberry framboesa 320g",
    category: "Mercearia",
    price: 39.9,
    stock: 6,
  },
  { id: "m5", name: "Ketchup 320g", category: "Mercearia", price: 12.9, stock: 10 },
  { id: "m6", name: "Maionese 215g", category: "Mercearia", price: 16.9, stock: 10 },
  { id: "m7", name: "Nescau 200g", category: "Mercearia", price: 12.9, stock: 12 },
  { id: "m8", name: "Passata de tomate 300g", category: "Mercearia", price: 12.9, stock: 10 },
  {
    id: "m9",
    name: "Passata de tomate temperada 520g",
    category: "Mercearia",
    price: 20.9,
    stock: 8,
  },
  { id: "m10", name: "Óleo de soja 900 ml", category: "Mercearia", price: 8.9, stock: 15 },

  // Snacks e Doces
  {
    id: "s1",
    name: "Amendoim japonês Dori 100g",
    category: "Snacks e Doces",
    price: 6.5,
    stock: 15,
  },
  { id: "s2", name: "Bala Fini 90g", category: "Snacks e Doces", price: 9.9, stock: 20 },
  { id: "s3", name: "Barra de proteína Bold", category: "Snacks e Doces", price: 23.9, stock: 15 },
  { id: "s4", name: "Batata palha 105g", category: "Snacks e Doces", price: 11.5, stock: 10 },
  { id: "s5", name: "Chocolate Lacta 80g", category: "Snacks e Doces", price: 8.9, stock: 18 },
  { id: "s6", name: "Ovinhos Elma Chips 60g", category: "Snacks e Doces", price: 5.9, stock: 15 },
  {
    id: "s7",
    name: "Pringles tradicional 100g",
    category: "Snacks e Doces",
    price: 19.9,
    stock: 12,
  },

  // Padaria e Matinais
  {
    id: "p1",
    name: "Granola da Magrinha 1kg",
    category: "Padaria e Matinais",
    price: 22.9,
    stock: 8,
  },
  { id: "p2", name: "Leve Toast", category: "Padaria e Matinais", price: 8.9, stock: 12 },
  { id: "p3", name: "Torrada Bauducco", category: "Padaria e Matinais", price: 5.9, stock: 15 },
  { id: "p4", name: "Torradinhas Snack's", category: "Padaria e Matinais", price: 6.9, stock: 15 },
];

const STORAGE_KEY = "zelo_market_products";
const MIN_STORAGE_KEY = "zelo_market_min_order";

export function useMarketStore() {
  const [products, setProducts] = useState<MarketProduct[]>(() => {
    if (typeof window === "undefined") return INITIAL_PRODUCTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: MarketProduct[] = JSON.parse(saved);
        return parsed.map((p) => ({ ...p, stock: p.stock ?? 0 }));
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [categories] = useState<string[]>(INITIAL_CATEGORIES);

  const [minOrder, setMinOrder] = useState<number>(() => {
    if (typeof window === "undefined") return 30;
    try {
      const saved = localStorage.getItem(MIN_STORAGE_KEY);
      return saved ? Number(saved) : 30;
    } catch {
      return 30;
    }
  });

  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        setProducts(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } else if (!error && (!data || data.length === 0)) {
        setProducts([]);
      } else {
        if (typeof window !== "undefined") {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local) setProducts(JSON.parse(local));
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) setProducts(JSON.parse(local));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("realtime-market-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts();
      })
      .subscribe();

    const handleSync = () => {
      if (typeof window === "undefined") return;
      try {
        const savedProds = localStorage.getItem(STORAGE_KEY);
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          setProducts(parsed.map((p: any) => ({ ...p, stock: p.stock ?? 0 })));
        }
        const savedMin = localStorage.getItem(MIN_STORAGE_KEY);
        if (savedMin) setMinOrder(Number(savedMin));
      } catch {}
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("zelo_market_updated", handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("zelo_market_updated", handleSync);
    };
  }, []);

  const updateProductStock = async (id: string, newStock: number) => {
    const updated = products.map((p) => (p.id === id ? { ...p, stock: newStock } : p));
    setProducts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("zelo_market_updated"));
    }

    try {
      const { error } = await (supabase as any)
        .from("products")
        .update({ stock: newStock })
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao sincronizar estoque:", err);
      throw err;
    }
  };

  const saveProducts = async (newProducts: MarketProduct[]) => {
    setProducts(newProducts);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
      window.dispatchEvent(new Event("zelo_market_updated"));
    }

    try {
      const { error } = await (supabase as any).from("products").upsert(newProducts);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar produtos:", err);
      throw err;
    }
  };

  const saveMinOrder = (newMin: number) => {
    setMinOrder(newMin);
    if (typeof window !== "undefined") {
      localStorage.setItem(MIN_STORAGE_KEY, String(newMin));
      window.dispatchEvent(new Event("zelo_market_updated"));
    }
  };

  return {
    products,
    categories: INITIAL_CATEGORIES,
    minOrder,
    loading,
    updateProductStock,
    refreshProducts: fetchProducts,
    saveProducts,
    saveMinOrder,
  };
}
