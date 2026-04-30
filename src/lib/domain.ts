import type { Channel, OrderStatus, PaymentMethod } from "./api";

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
  site: "Site proprio",
  balcao: "Balcao",
};

export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  credito: "Credito",
  debito: "Debito",
  dinheiro: "Dinheiro",
};
