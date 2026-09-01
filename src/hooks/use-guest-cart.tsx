import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export type GuestCartItem = {
  id: string;
  name: string;
  category: "kit" | "mercado" | "limpeza" | "organizacao" | "servico";
  quantity: number;
  unitPrice: number;
  serviceKey?: string;
  productId?: string;
  authorizationCode?: string;
  observation?: string;
};

type GuestCartContextValue = {
  items: GuestCartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<GuestCartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setObservation: (id: string, observation: string) => void;
  clear: () => void;
};

const GuestCartContext = createContext<GuestCartContextValue | null>(null);

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `zelo_guest_cart_${user.id}` : null;
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      setLoadedKey(null);
      return;
    }

    try {
      // Migra automaticamente carrinhos antigos que estavam apenas na sessão.
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

  const value = useMemo<GuestCartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    addItem: (item, quantity = 1) => setItems((current) => {
      const existing = current.find(
        (entry) => entry.id === item.id && entry.authorizationCode === item.authorizationCode,
      );
      return existing
        ? current.map((entry) =>
            entry === existing ? { ...entry, quantity: entry.quantity + quantity } : entry,
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
    setObservation: (id, observation) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, observation } : item)),
      ),
    clear: () => setItems([]),
  }), [items]);

  return <GuestCartContext.Provider value={value}>{children}</GuestCartContext.Provider>;
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (!context) throw new Error("useGuestCart precisa estar dentro de GuestCartProvider.");
  return context;
}
