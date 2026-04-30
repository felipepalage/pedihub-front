// Mock data for PEDIHUB - replace with real API calls (C# .NET REST) later

export type OrderStatus =
  | "novo"
  | "aceito"
  | "preparando"
  | "saiu_entrega"
  | "finalizado"
  | "cancelado";

export type Channel = "ifood" | "whatsapp" | "site" | "balcao";

export interface Order {
  id: string;
  number: number;
  channel: Channel;
  customer: string;
  total: number;
  time: string;
  status: OrderStatus;
  payment: "pix" | "credito" | "debito" | "dinheiro";
  items: { name: string; qty: number; price: number }[];
  address?: string;
}

export const orders: Order[] = [
  {
    id: "1",
    number: 1042,
    channel: "ifood",
    customer: "João Pereira",
    total: 89.9,
    time: "12:42",
    status: "novo",
    payment: "pix",
    items: [
      { name: "Combo X-Bacon", qty: 2, price: 32.9 },
      { name: "Coca-Cola 600ml", qty: 1, price: 8.5 },
    ],
    address: "Rua das Flores, 123 - Centro",
  },
  {
    id: "2",
    number: 1041,
    channel: "whatsapp",
    customer: "Maria Souza",
    total: 56.0,
    time: "12:35",
    status: "preparando",
    payment: "credito",
    items: [{ name: "Pizza Calabresa", qty: 1, price: 56.0 }],
  },
  {
    id: "3",
    number: 1040,
    channel: "site",
    customer: "Carlos Lima",
    total: 124.5,
    time: "12:28",
    status: "saiu_entrega",
    payment: "pix",
    items: [
      { name: "Vinho Tinto Reserva", qty: 1, price: 89.9 },
      { name: "Queijo Brie 200g", qty: 1, price: 34.6 },
    ],
  },
  {
    id: "4",
    number: 1039,
    channel: "ifood",
    customer: "Ana Beatriz",
    total: 42.0,
    time: "12:15",
    status: "finalizado",
    payment: "debito",
    items: [{ name: "Porção Batata", qty: 2, price: 21.0 }],
  },
  {
    id: "5",
    number: 1038,
    channel: "balcao",
    customer: "Pedro Henrique",
    total: 18.5,
    time: "12:02",
    status: "finalizado",
    payment: "dinheiro",
    items: [{ name: "Chopp Pilsen 300ml", qty: 2, price: 9.25 }],
  },
  {
    id: "6",
    number: 1037,
    channel: "whatsapp",
    customer: "Lúcia Mendes",
    total: 75.4,
    time: "11:48",
    status: "aceito",
    payment: "pix",
    items: [{ name: "Combo família", qty: 1, price: 75.4 }],
  },
  {
    id: "7",
    number: 1036,
    channel: "ifood",
    customer: "Rafael Gomes",
    total: 33.0,
    time: "11:30",
    status: "cancelado",
    payment: "credito",
    items: [{ name: "Hambúrguer simples", qty: 1, price: 33.0 }],
  },
];

export interface Product {
  id: string;
  image: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  stock: number;
  promo: boolean;
}

export const products: Product[] = [
  {
    id: "p1",
    image: "🍔",
    name: "X-Bacon Especial",
    category: "Lanches",
    price: 32.9,
    available: true,
    stock: 50,
    promo: false,
  },
  {
    id: "p2",
    image: "🍕",
    name: "Pizza Calabresa Grande",
    category: "Combos",
    price: 56.0,
    available: true,
    stock: 20,
    promo: true,
  },
  {
    id: "p3",
    image: "🍷",
    name: "Vinho Tinto Reserva",
    category: "Bebidas",
    price: 89.9,
    available: true,
    stock: 12,
    promo: false,
  },
  {
    id: "p4",
    image: "🍟",
    name: "Porção Batata Frita",
    category: "Porções",
    price: 21.0,
    available: true,
    stock: 100,
    promo: false,
  },
  {
    id: "p5",
    image: "🥤",
    name: "Coca-Cola 600ml",
    category: "Bebidas",
    price: 8.5,
    available: true,
    stock: 80,
    promo: false,
  },
  {
    id: "p6",
    image: "🍺",
    name: "Chopp Pilsen 300ml",
    category: "Bebidas",
    price: 9.25,
    available: false,
    stock: 0,
    promo: false,
  },
  {
    id: "p7",
    image: "🧀",
    name: "Tábua de Frios",
    category: "Porções",
    price: 64.0,
    available: true,
    stock: 8,
    promo: true,
  },
  {
    id: "p8",
    image: "🥃",
    name: "Whisky 12 anos",
    category: "Bebidas",
    price: 189.0,
    available: true,
    stock: 5,
    promo: false,
  },
];

export const categories = ["Bebidas", "Combos", "Lanches", "Porções", "Outros"];

export interface Customer {
  id: string;
  company: string;
  plan: "Starter" | "Pro" | "Enterprise";
  status: "ativo" | "trial" | "inativo";
  lastAccess: string;
  signupDate: string;
}

export const customers: Customer[] = [
  {
    id: "c1",
    company: "Adega do Vinho Bom",
    plan: "Pro",
    status: "ativo",
    lastAccess: "Hoje, 12:30",
    signupDate: "12/01/2024",
  },
  {
    id: "c2",
    company: "Bar do Zé",
    plan: "Starter",
    status: "trial",
    lastAccess: "Ontem",
    signupDate: "20/04/2026",
  },
  {
    id: "c3",
    company: "Pizzaria Bella Napoli",
    plan: "Pro",
    status: "ativo",
    lastAccess: "Hoje, 11:15",
    signupDate: "03/09/2024",
  },
  {
    id: "c4",
    company: "Mercadinho Central",
    plan: "Enterprise",
    status: "ativo",
    lastAccess: "Hoje, 09:42",
    signupDate: "18/06/2023",
  },
  {
    id: "c5",
    company: "Lanchonete Cantinho",
    plan: "Starter",
    status: "inativo",
    lastAccess: "12 dias atrás",
    signupDate: "10/02/2024",
  },
];

export const salesByDay = [
  { day: "Sex", value: 1240 },
  { day: "Sáb", value: 2350 },
  { day: "Dom", value: 1980 },
  { day: "Seg", value: 890 },
  { day: "Ter", value: 1520 },
  { day: "Qua", value: 1780 },
  { day: "Qui", value: 2640 },
];

export const ordersByHour = [
  { hour: "10h", value: 4 },
  { hour: "11h", value: 12 },
  { hour: "12h", value: 28 },
  { hour: "13h", value: 22 },
  { hour: "14h", value: 8 },
  { hour: "18h", value: 14 },
  { hour: "19h", value: 26 },
  { hour: "20h", value: 32 },
  { hour: "21h", value: 18 },
];

export const channelMix = [
  { name: "iFood", value: 48, color: "var(--color-primary)" },
  { name: "WhatsApp", value: 28, color: "var(--color-success)" },
  { name: "Site", value: 16, color: "var(--color-info)" },
  { name: "Balcão", value: 8, color: "var(--color-warning)" },
];

export const topProducts = [
  { name: "X-Bacon Especial", sold: 142, revenue: 4671.8 },
  { name: "Pizza Calabresa", sold: 98, revenue: 5488.0 },
  { name: "Coca-Cola 600ml", sold: 210, revenue: 1785.0 },
  { name: "Porção Batata", sold: 76, revenue: 1596.0 },
  { name: "Chopp Pilsen", sold: 165, revenue: 1526.25 },
];

export const statusLabels: Record<OrderStatus, string> = {
  novo: "Novo",
  aceito: "Aceito",
  preparando: "Preparando",
  saiu_entrega: "Saiu p/ entrega",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const channelLabels: Record<Channel, string> = {
  ifood: "iFood",
  whatsapp: "WhatsApp",
  site: "Site próprio",
  balcao: "Balcão",
};

export const paymentLabels = {
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
};
