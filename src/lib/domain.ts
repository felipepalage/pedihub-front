import type { Channel, OrderStatus, PaymentMethod } from "./api";

export const statusLabels: Record<OrderStatus, string> = {
  novo: "Novo",
  aceito: "Aceito",
  preparando: "Preparando",
  saiu_entrega: "Saiu p/ entrega",
  pronto_retirada: "Pronto p/ retirada",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

// Get status labels based on order type
export const getStatusLabelsForOrderType = (type: "delivery" | "pickup"): Record<OrderStatus, string> => {
  if (type === "pickup") {
    return {
      novo: "Novo",
      aceito: "Aceito",
      preparando: "Preparando",
      saiu_entrega: "Saiu p/ entrega", // Won't be used for pickup, but include for type safety
      pronto_retirada: "Pronto p/ retirada",
      finalizado: "Finalizado",
      cancelado: "Cancelado",
    };
  }
  return statusLabels;
};

// Get valid status transitions based on order type
export const getValidStatusesForOrderType = (type: "delivery" | "pickup"): OrderStatus[] => {
  if (type === "pickup") {
    return ["novo", "aceito", "preparando", "pronto_retirada", "finalizado", "cancelado"];
  }
  return ["novo", "aceito", "preparando", "saiu_entrega", "finalizado", "cancelado"];
};

export const channelLabels: Record<Channel, string> = {
  ifood: "iFood",
  "99food": "99Food",
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
