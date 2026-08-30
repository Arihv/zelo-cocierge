// Catalog data (product offerings) + empty placeholders for user-generated data.
// User, order, apartment, reservation, service, stock, notification, log and revenue lists
// are intentionally empty — they will be populated with real data from the
// database/localStorage as the platform is used.

export interface Property {
  id: string;
  name: string;
  type: string;
  owner: string;
  address: string;
  status: "Ocupado" | "Disponível";
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  propertyCode: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface UserAccount {
  id?: string;
  name: string;
  email: string;
  role: "Administrador" | "Hóspede" | "Proprietário";
  status: string;
  phone?: string;
  propertyCode?: string;
}

export interface OrderItem {
  id: string;
  solicitante?: string;
  guest?: string;
  apt?: string;
  imovel?: string;
  perfil?: string;
  categoria?: string;
  type?: string;
  itens?: string;
  status?: string;
  value?: number;
  valor?: string;
  date?: string;
  data?: string;
}

export const brand = {
  name: "Zelo",
  tagline: "Hospitalidade e serviços completos para hóspedes e anfitriões.",
};

export const currentGuest = {
  name: "",
  code: "",
  apartment: "",
  address: "",
  checkIn: "",
  checkOut: "",
  status: "",
};

export const guestRecentOrders: OrderItem[] = [];

export const marketCategories = [
  "Mercearia",
  "Bebidas",
  "Café da manhã",
  "Limpeza",
  "Higiene",
] as const;

// Catálogo de produtos padrão para o mercado
export const marketProducts = [
  { id: "arroz", name: "Arroz Tipo 1 — 1kg", category: "Mercearia", price: 12.9, stock: 0 },
  { id: "feijao", name: "Feijão Carioca — 1kg", category: "Mercearia", price: 10.5, stock: 0 },
  { id: "macarrao", name: "Macarrão Grano Duro", category: "Mercearia", price: 8.9, stock: 0 },
  { id: "cafe", name: "Café Torrado 500g", category: "Café da manhã", price: 22.0, stock: 0 },
  { id: "leite", name: "Leite Integral 1L", category: "Café da manhã", price: 7.4, stock: 0 },
  { id: "manteiga", name: "Manteiga com Sal 200g", category: "Café da manhã", price: 18.9, stock: 0 },
  { id: "requeijao", name: "Requeijão Cremoso", category: "Café da manhã", price: 14.9, stock: 0 },
  { id: "agua", name: "Água Mineral 1,5L", category: "Bebidas", price: 5.5, stock: 0 },
  { id: "refri", name: "Refrigerante 2L", category: "Bebidas", price: 12.0, stock: 0 },
  { id: "deterg", name: "Detergente Neutro", category: "Limpeza", price: 4.9, stock: 0 },
  { id: "sabao", name: "Sabão em Pó 1kg", category: "Limpeza", price: 19.9, stock: 0 },
  { id: "shampoo", name: "Shampoo 400ml", category: "Higiene", price: 24.9, stock: 0 },
];

// Catálogo de kits oferecidos
export const kits = {
  cafe: [
    { id: "individual", name: "Kit Individual", people: 1, price: 49.9, items: ["Pão", "Café", "Açúcar", "Manteiga", "Ovos"] },
    { id: "casal", name: "Kit Casal", people: 2, price: 89.9, items: ["Pão (dobrado)", "Café", "Açúcar", "Manteiga", "Ovos", "Queijo"] },
    { id: "familia", name: "Kit Família", people: 4, price: 159.9, items: ["Pão (4x)", "Café", "Açúcar", "Manteiga", "Ovos (12)", "Queijo", "Presunto"] },
  ],
  refeicao: [
    { id: "basico", name: "Kit Refeição Básico", price: 39.9, items: ["Macarrão", "Molho bolonhesa"] },
    { id: "completo", name: "Kit Refeição Completo", price: 74.0, items: ["Macarrão", "Molho bolonhesa", "Queijo ralado", "Bebida"] },
  ],
};

// Catálogo de tipos de limpeza oferecidos
export const cleaningTypes = [
  { id: "completa", name: "Limpeza Completa", scope: ["Quartos", "Banheiros", "Cozinha", "Sala"] },
  { id: "enxoval", name: "Troca de Enxoval", scope: ["Lençóis", "Fronhas", "Toalhas"] },
  { id: "estofados", name: "Limpeza de Estofados", scope: ["Sofás", "Poltronas"] },
];

// Listas de dados reais zeradas para alimentar pelo painel
export const properties: Property[] = [];
export const apartments: Property[] = [];
export const reservations: Reservation[] = [];
export const users: UserAccount[] = [];
export const orders: OrderItem[] = [];
export const stock: { name: string; qty: number; min: number; status: string }[] = [];
export const services: { id: string; type: string; apt: string; date: string; status: string }[] = [];
export const notifications: { id: number; title: string; body: string; time: string }[] = [];
export const revenueSeries: { m: string; value: number }[] = [];
export const categorySeries: { name: string; value: number }[] = [];
export const auditLogs: { at: string; who: string; action: string }[] = [];

export function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}