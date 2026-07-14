import type { Channel, OrderStatus, PaymentMethod } from "./api";

export const statusLabels: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguard. Pagamento",
  pago: "Pago",
  novo: "Novo",
  aceito: "Aceito",
  preparando: "Preparando",
  saiu_entrega: "Saiu p/ entrega",
  pronto_retirada: "Pronto p/ retirada",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const getStatusLabelsForOrderType = (type: "delivery" | "pickup"): Record<OrderStatus, string> => {
  if (type === "pickup") {
    return {
      aguardando_pagamento: "Aguard. Pagamento",
      pago: "Pago",
      novo: "Novo",
      aceito: "Aceito",
      preparando: "Preparando",
      saiu_entrega: "Saiu p/ entrega",
      pronto_retirada: "Pronto p/ retirada",
      finalizado: "Finalizado",
      cancelado: "Cancelado",
    };
  }
  return statusLabels;
};

export const getValidStatusesForOrderType = (type: "delivery" | "pickup"): OrderStatus[] => {
  if (type === "pickup") {
    return ["aguardando_pagamento", "pago", "novo", "aceito", "preparando", "pronto_retirada", "finalizado", "cancelado"];
  }
  return ["aguardando_pagamento", "pago", "novo", "aceito", "preparando", "saiu_entrega", "finalizado", "cancelado"];
};

export const channelLabels: Record<Channel, string> = {
  ifood: "iFood",
  "99food": "99Food",
  whatsapp: "WhatsApp",
  site: "Site proprio",
  balcao: "Balcao",
  mesa: "Atendimento Mesa",
};

export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  credito: "Credito",
  debito: "Debito",
  dinheiro: "Dinheiro",
};
