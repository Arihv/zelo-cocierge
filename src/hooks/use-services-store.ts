import { useState, useEffect } from "react";

export interface CleaningPrices {
  S: number;
  D: number;
  T: number;
}

export interface AmenityService {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  requiresAuth: boolean;
  showWhatsApp: boolean;
}

const DEFAULT_CLEANING: CleaningPrices = {
  S: 190,
  D: 280,
  T: 330,
};

const DEFAULT_AMENITIES: AmenityService[] = [
  {
    id: "manta",
    name: "Aluguel de Manta de Microfibra Extra",
    category: "Conforto & Enxoval",
    price: 25,
    description: "Manta de microfibra de qualidade para conforto adicional.",
    requiresAuth: true,
    showWhatsApp: true,
  },
  {
    id: "aquecedor",
    name: "Aluguel de Mini Aquecedores Portáteis",
    category: "Climatização",
    price: 30,
    description: "Mini aquecedor portátil de segurança.",
    requiresAuth: true,
    showWhatsApp: true,
  },
  {
    id: "travesseiro",
    name: "Aluguel de Travesseiros Extras",
    category: "Conforto & Enxoval",
    price: 15,
    description: "Travesseiro extra de qualidade.",
    requiresAuth: true,
    showWhatsApp: true,
  },
];

const SERVICES_KEY = "zelo_services_amenities";
const CLEANING_KEY = "zelo_services_cleaning_prices";

export function useServicesStore() {
  const [amenities, setAmenities] = useState<AmenityService[]>(() => {
    const saved = localStorage.getItem(SERVICES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_AMENITIES;
  });

  const [cleaningPrices, setCleaningPrices] = useState<CleaningPrices>(() => {
    const saved = localStorage.getItem(CLEANING_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CLEANING;
  });

  useEffect(() => {
    const handleSync = () => {
      const savedAmenities = localStorage.getItem(SERVICES_KEY);
      if (savedAmenities) setAmenities(JSON.parse(savedAmenities));

      const savedCleaning = localStorage.getItem(CLEANING_KEY);
      if (savedCleaning) setCleaningPrices(JSON.parse(savedCleaning));
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("zelo_services_updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("zelo_services_updated", handleSync);
    };
  }, []);

  const saveAmenities = (newAmenities: AmenityService[]) => {
    setAmenities(newAmenities);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(newAmenities));
    window.dispatchEvent(new Event("zelo_services_updated"));
  };

  const saveCleaningPrices = (newPrices: CleaningPrices) => {
    setCleaningPrices(newPrices);
    localStorage.setItem(CLEANING_KEY, JSON.stringify(newPrices));
    window.dispatchEvent(new Event("zelo_services_updated"));
  };

  return {
    amenities,
    cleaningPrices,
    saveAmenities,
    saveCleaningPrices,
  };
}