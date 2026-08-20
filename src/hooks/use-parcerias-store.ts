import { useState, useEffect } from "react";

export interface Parceria {
  id: string;
  nome: string;
  categoria: string;
  beneficio: string;
  cupom?: string;
  contato?: string;
  link?: string;
  ativo: boolean;
}

const STORAGE_KEY = "zelo_parcerias_data";

export function useParceriasStore() {
  const [parcerias, setParcerias] = useState<Parceria[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      setParcerias(saved ? JSON.parse(saved) : []);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("zelo_parcerias_updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("zelo_parcerias_updated", handleSync);
    };
  }, []);

  const saveParcerias = (newParcerias: Parceria[]) => {
    setParcerias(newParcerias);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newParcerias));
    window.dispatchEvent(new Event("zelo_parcerias_updated"));
  };

  return {
    parcerias,
    saveParcerias,
  };
}