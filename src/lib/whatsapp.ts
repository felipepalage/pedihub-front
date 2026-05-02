import { OrderDetail } from "./api";

export function formatOrderToWhatsApp(order: OrderDetail, storeUrl?: string): string {
  // Format currency
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const baseUrl = storeUrl || window.location.origin;
  const trackingLink = `${baseUrl}/${order.channel === 'site' ? '' : ''}${order.id}`; // Placeholder - store slug not available here

  let text = `✅ NOVO PEDIDO\n`;
  text += `-----------------------------\n`;
  text += `▶️ RESUMO DO PEDIDO\n\n`;
  text += `Pedido #${order.number}\n\n`;
  text += `Link para acompanhar status do pedido:\n${trackingLink}\n\n`;

  let subtotal = 0;
  order.items.forEach((item) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    text += `${item.qty}x ${item.name} (${formatMoney(item.price)})\n\n`;
    text += `Subtotal do item: ${formatMoney(itemTotal)}\n`;
    text += `-  -  -  -  -  -  -  -  -  -  -\n\n`;
  });

  text += `SUBTOTAL: ${formatMoney(subtotal)}\n\n`;
  text += `------------------------------------------\n`;
  text += `▶️ Dados para entrega\n\n`;
  text += `Nome: ${order.customerName}\n`;
  
  if (order.street) {
    text += `Endereço: ${order.street}, nº: ${order.addressNumber || "S/N"}\n`;
    if (order.neighborhood) text += `Bairro: ${order.neighborhood}\n`;
    if (order.complement) text += `Complemento: ${order.complement}\n`;
    if (order.referencePoint) text += `Ponto de Referência: ${order.referencePoint}\n`;
  } else if (order.address) {
    text += `Endereço: ${order.address}\n`;
  }
  
  text += `Telefone: ${order.customerPhone || "Não informado"}\n\n`;

  if (order.deliveryFee > 0) {
    text += `Taxa de Entrega: ${formatMoney(order.deliveryFee)}\n\n`;
  }

  // Estimated time logic
  const now = new Date();
  const deliveryStart = new Date(now.getTime() + 45 * 60000); // approx +45 mins
  const deliveryEnd = new Date(now.getTime() + 60 * 60000); // approx +60 mins
  
  const formatTime = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  
  text += `🕙 Tempo de Entrega: aprox. ${formatTime(deliveryStart)} a ${formatTime(deliveryEnd)}\n\n`;
  
  text += `-------------------------------\n`;
  text += `▶️ TOTAL = ${formatMoney(order.total)}\n`;
  text += `-------------------------------\n\n`;
  
  text += `▶️ PAGAMENTO\n\n`;
  
  let paymentText = order.payment;
  switch (order.payment) {
    case "dinheiro": paymentText = "Dinheiro"; break;
    case "pix": paymentText = "PIX"; break;
    case "credito": paymentText = "Cartão de Crédito"; break;
    case "debito": paymentText = "Cartão de Débito"; break;
  }
  
  text += `Pagamento em ${paymentText}\n`;
  
  if (order.payment === "dinheiro" && order.changeFor) {
    text += `Troco para ${formatMoney(order.changeFor)}\n`;
  }

  return text;
}

export function formatStatusUpdateToWhatsApp(order: OrderDetail): string {
  const statusMessages: Record<string, string> = {
    aceito: "✅ Seu pedido foi aceito e ja esta na nossa fila!",
    preparando: "👨‍🍳 Oba! Seu pedido ja esta sendo preparado com todo carinho.",
    saiu_entrega: "🚀 Noticia boa: seu pedido acabou de sair para entrega!",
    finalizado: "🏁 Seu pedido foi entregue. Esperamos que goste! Ate a proxima.",
    cancelado: "❌ Poxa, seu pedido precisou ser cancelado. Entre em contato conosco para mais detalhes.",
  };

  const message = statusMessages[order.status] || "Atualizamos o status do seu pedido!";

  let text = `Ola, ${order.customerName}! 👋\n\n`;
  text += `${message}\n\n`;
  text += `📦 *Pedido #${order.number}*\n`;
  text += `-----------------------------\n`;
  text += `Para qualquer duvida, estamos a disposicao!`;

  return text;
}

export function generateWhatsAppLink(phone: string, text: string): string {
  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, "");
  // URI encode text
  const encodedText = encodeURIComponent(text);
  
  return `https://wa.me/55${cleanPhone}?text=${encodedText}`;
}
