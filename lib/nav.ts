import {
  LayoutDashboard, Package, ShoppingBasket, CreditCard, History,
  Home, Sparkles, ClipboardList, Wrench, FileBarChart2,
  ConciergeBell, Handshake, Users, CalendarRange, WalletCards
} from "lucide-react";
import type { NavItem } from "@/components/dashboard-shell";

export const guestNav: NavItem[] = [
  { to: "/hospede/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hospede/servicos", label: "Serviços", icon: ConciergeBell },
  { to: "/hospede/kits", label: "Kits", icon: Package },
  { to: "/hospede/mercado", label: "Mercado", icon: ShoppingBasket },
  { to: "/hospede/carrinho", label: "Carrinho", icon: CreditCard },
  { to: "/hospede/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/hospede/historico", label: "Histórico", icon: History },
];

export const ownerNav: NavItem[] = [
  { to: "/proprietario/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/proprietario/apartamentos", label: "Apartamentos", icon: Home },
  { to: "/proprietario/servicos", label: "Serviços", icon: ConciergeBell },
  { to: "/proprietario/mercado", label: "Mercado", icon: ShoppingBasket },
  { to: "/proprietario/carrinho", label: "Carrinho", icon: CreditCard },
  { to: "/proprietario/kits", label: "Kits & Cardápio", icon: Package },
  { to: "/proprietario/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/proprietario/pedidos", label: "Histórico de Pedidos", icon: History },
  { to: "/proprietario/parcerias", label: "Parcerias", icon: Handshake },
];

export const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/imoveis", label: "Imóveis", icon: Home },
  { to: "/admin/reservas", label: "Reservas", icon: CalendarRange },
  { to: "/admin/pedidos", label: "Pedidos", icon: History },
  { to: "/admin/chamados", label: "Chamados", icon: Wrench },
  { to: "/admin/servicos", label: "Serviços", icon: ConciergeBell },
  { to: "/admin/mercado", label: "Gestão do Mercado", icon: ShoppingBasket },
  { to: "/admin/kits", label: "Kits & Cardápio", icon: Package },
  { to: "/admin/financeiro", label: "Financeiro & Contas", icon: WalletCards },
  { to: "/admin/parcerias", label: "Parcerias", icon: Handshake },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart2 },
];
