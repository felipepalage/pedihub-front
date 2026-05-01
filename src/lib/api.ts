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
  logoUrl?: string | null;
  role: string;
  validUntil: string;
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
  customerPhone: string;
  deliveryFee: number;
  changeFor: number | null;
  street: string;
  addressNumber: string;
  neighborhood: string;
  complement: string;
  referencePoint: string;
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

export interface ModifierOption {
  id?: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id?: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  stock: number;
  promo: boolean;
  modifierGroups?: ModifierGroup[];
}

export interface ProductPayload {
  image: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  stock: number;
  promo: boolean;
  modifierGroups?: ModifierGroup[];
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
  whatsAppNumber: string;
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

  try {
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
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`API Request Error [${path}]:`, error);
    throw new ApiError("Erro de conexao com o servidor.", 503);
  }
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

export interface TopProductMetric {
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  todayOrders: number;
  topProducts: TopProductMetric[];
}

export function getDashboard() {
  return apiRequest<DashboardSummary>("/api/dashboard");
}

export function getAnalyticsSummary() {
  return apiRequest<AnalyticsSummary>("/api/analytics/summary");
}

export interface LoyaltyProgram {
  id?: string;
  isActive: boolean;
  pointsPerReal: number;
  minPointsToRedeem: number;
  redeemValue: number;
}

export interface MerchantTable {
  id?: string;
  number: string;
  qrCodeUrl: string;
}

export function getLoyaltyProgram() {
  return apiRequest<LoyaltyProgram>("/api/loyalty/program");
}

export function updateLoyaltyProgram(payload: LoyaltyProgram) {
  return apiRequest<LoyaltyProgram>("/api/loyalty/program", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getTables() {
  return apiRequest<MerchantTable[]>("/api/tables");
}

export function createTable(number: string) {
  return apiRequest<MerchantTable>("/api/tables", {
    method: "POST",
    body: JSON.stringify({ number }),
  });
}

export function deleteTable(id: string) {
  return apiRequest<void>(`/api/tables/${id}`, {
    method: "DELETE",
  });
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

// Admin & Subscriptions

export interface AdminMerchant {
  id: string;
  companyName: string;
  cnpj: string;
  plan: string;
  status: string;
  createdAt: string;
  validUntil: string;
}

export interface ActivationToken {
  id: string;
  code: string;
  months: number;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string | null;
}

export function activateSubscription(code: string) {
  return apiRequest<{ message: string; validUntil: string }>("/api/subscription/activate", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getAdminMerchants() {
  return apiRequest<AdminMerchant[]>("/api/admin/merchants");
}

export function getAdminTokens() {
  return apiRequest<ActivationToken[]>("/api/admin/tokens");
}

export function createAdminToken(months: number) {
  return apiRequest<ActivationToken>("/api/admin/tokens", {
    method: "POST",
    body: JSON.stringify({ months }),
  });
}

// Store (Customer Facing)

export interface StorePublic {
  id: string;
  companyName: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  phone: string;
  openingHours: string;
  deliveryFeeBase: number;
  minimumOrder: number;
  status: string;
}

export interface StoreProduct {
  id: string;
  image: string;
  name: string;
  description: string;
  price: number;
  promo: boolean;
}

export interface StoreCartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  type: "delivery" | "pickup";
  payment: "pix" | "cartao" | "dinheiro";
  changeFor?: number;
  zipCode?: string;
  street?: string;
  addressNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
  referencePoint?: string;
  items: StoreCartItem[];
}

export function getStoreInfo(slug: string) {
  return apiRequest<StorePublic>(`/api/store/${slug}`);
}

export function getStoreProducts(slug: string) {
  return apiRequest<StoreProduct[]>(`/api/store/${slug}/products`);
}

export function getStoreOrder(slug: string, orderNumber: number) {
  return apiRequest<OrderDetail>(`/api/store/${slug}/orders/${orderNumber}`);
}

export function placeStoreOrder(slug: string, payload: PlaceOrderPayload) {
  return apiRequest<{ message: string; orderNumber: number }>(`/api/store/${slug}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


