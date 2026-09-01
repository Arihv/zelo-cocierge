import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export type OwnerCartItem = {
  id: string;
  name: string;
  category: "mercado" | "kit";
  quantity: number;
  unitPrice: number;
  productId?: string;
  serviceKey?: string;
};

type OwnerCartContextValue = {
  items: OwnerCartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<OwnerCartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const OwnerCartContext = createContext<OwnerCartContextValue | null>(null);

export function OwnerCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `zelo_owner_cart_${user.id}` : null;
  const [items, setItems] = useState<OwnerCartItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      setLoadedKey(null);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey) ?? "[]";
      setItems(JSON.parse(saved));
      if (!localStorage.getItem(storageKey) && sessionStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, saved);
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      setItems([]);
    } finally {
      setLoadedKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && loadedKey === storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, storageKey, loadedKey]);

  const value = useMemo<OwnerCartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    addItem: (item, quantity = 1) => setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      return existing
        ? current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry,
          )
        : [...current, { ...item, quantity }];
    }),
    setQuantity: (id, quantity) =>
      setItems((current) =>
        current.flatMap((item) =>
          item.id === id ? (quantity > 0 ? [{ ...item, quantity }] : []) : [item],
        ),
      ),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <OwnerCartContext.Provider value={value}>{children}</OwnerCartContext.Provider>;
}

export function useOwnerCart() {
  const context = useContext(OwnerCartContext);
  if (!context) throw new Error("useOwnerCart precisa estar dentro de OwnerCartProvider.");
  return context;
}
