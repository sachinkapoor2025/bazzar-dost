export const WHATSAPP_MESSAGE = "Hello BazaarDost, I need help with a product or order.";

export function whatsAppNumber(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): string {
  return raw.replace(/\D/g, "");
}

export function whatsAppReady(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): boolean {
  const number = whatsAppNumber(raw);
  return number.length >= 10 && number.length <= 15;
}

export function whatsAppHref(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): string {
  return `https://wa.me/${whatsAppNumber(raw)}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}
