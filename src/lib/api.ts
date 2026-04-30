import { readStoredSession } from "./session";

export type OrderStatus =
  | "novo"
  | "aceito"
  | "preparando"
  | "saiu_entrega"
  | "finalizado"
  | "cancelado";

export type Channel = "ifood" | "whatsapp" | "site" | "balcao";
export type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro";

export interface AuthUser {
  userId: string;
  merchantId: string;
  fullName: string;
  email: string;
  merchantName: string;
  plan: string;
  status: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  companyName: string;
  cnpj: string;
  unitCount: number;
  segment: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  averageTicketToday: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  ordersDeltaPercent: number;
  revenueDeltaPercent: number;
  averageTicketDeltaPercent: number;
}

export interface SalesPoint {
  day: string;
  value: number;
}

export interface HourPoint {
  hour: string;
  value: number;
}

export interface ChannelMixItem {
  name: string;
  value: number;
  channel: Channel;
}

export interface DashboardAlert {
  text: string;
  severity: "warning" | "destructive" | "info";
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderListItem {
  id: string;
  number: number;
  channel: Channel;
  customer: string;
  total: number;
  time: string;
  status: OrderStatus;
  payment: PaymentMethod;
}

export interface OrderDetail extends OrderListItem {
  address?: string | null;
  items: OrderItem[];
}

export interface DashboardSummary {
  merchantName: string;
  plan: string;
  stats: DashboardStats;
  salesByDay: SalesPoint[];
  ordersByHour: HourPoint[];
  channelMix: ChannelMixItem[];
  alerts: DashboardAlert[];
  recentOrders: OrderListItem[];
}

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

export interface ProductPayload {
  image: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  stock: number;
  promo: boolean;
}

export interface CustomerSummary {
  id: string;
  company: string;
  plan: "Starter" | "Pro" | "Enterprise";
  status: "ativo" | "trial" | "inativo";
  lastAccessAt?: string | null;
  signupDate: string;
}

export interface ReportSummaryBlock {
  label: string;
  value: string;
}

export interface MonthlyPoint {
  month: string;
  value: number;
}

export interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

export interface ReportsResponse {
  summary: ReportSummaryBlock[];
  monthlySales: MonthlyPoint[];
  ordersByHour: HourPoint[];
  topProducts: TopProduct[];
  weeklySales: SalesPoint[];
}

export interface SettingsPayload {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: string;
  averagePrepMinutes: number;
  deliveryFeeBase: number;
  minimumOrder: number;
  autoAcceptOrders: boolean;
  primaryColor: string;
  logoUrl: string;
  bannerUrl: string;
}

export type Settings = SettingsPayload;

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: "ativo" | "em_breve" | "disponivel";
  emoji: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5172";

async function apiRequest<T>(path: string, init?: RequestInit, expectBlob = false): Promise<T> {
  const session = readStoredSession();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = "Nao foi possivel concluir a requisicao.";

    if (contentType.includes("application/json")) {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new ApiError(message, response.status);
  }

  if (expectBlob) {
    return (await response.blob()) as T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQueryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiRequest<AuthUser>("/api/auth/me");
}

export function getDashboard() {
  return apiRequest<DashboardSummary>("/api/dashboard");
}

export function getOrders(params?: { filter?: string; search?: string }) {
  return apiRequest<OrderListItem[]>(`/api/orders${toQueryString(params ?? {})}`);
}

export function getOrder(id: string) {
  return apiRequest<OrderDetail>(`/api/orders/${id}`);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return apiRequest<OrderDetail>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function advanceOrder(id: string) {
  return apiRequest<OrderDetail>(`/api/orders/${id}/advance`, {
    method: "POST",
  });
}

export function getProducts(params?: { category?: string; search?: string }) {
  return apiRequest<Product[]>(`/api/products${toQueryString(params ?? {})}`);
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: string, payload: ProductPayload) {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleProductAvailability(id: string) {
  return apiRequest<Product>(`/api/products/${id}/availability`, {
    method: "PATCH",
  });
}

export function duplicateProduct(id: string) {
  return apiRequest<Product>(`/api/products/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteProduct(id: string) {
  return apiRequest<void>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export function getCustomers(search?: string) {
  return apiRequest<CustomerSummary[]>(`/api/customers${toQueryString({ search })}`);
}

export function getReports() {
  return apiRequest<ReportsResponse>("/api/reports");
}

export function downloadReportsCsv() {
  return apiRequest<Blob>("/api/reports/export/csv", undefined, true);
}

export function getSettings() {
  return apiRequest<Settings>("/api/settings");
}

export function updateSettings(payload: SettingsPayload) {
  return apiRequest<Settings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getIntegrations() {
  return apiRequest<Integration[]>("/api/integrations");
}

export function connectIntegration(id: string) {
  return apiRequest<Integration>(`/api/integrations/${id}/connect`, {
    method: "POST",
  });
}

export function disconnectIntegration(id: string) {
  return apiRequest<Integration>(`/api/integrations/${id}/disconnect`, {
    method: "POST",
  });
}
