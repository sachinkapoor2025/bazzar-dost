export const WHATSAPP_MESSAGE = "Hello, I need assistance.";
const DEFAULT_WHATSAPP_NUMBER = "919911083275";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function whatsAppNumber(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): string {
  const configured = digits(raw);
  if (configured.length >= 10 && configured.length <= 15) return configured;
  return DEFAULT_WHATSAPP_NUMBER;
}

export function whatsAppReady(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): boolean {
  return whatsAppNumber(raw).length >= 10;
}

export function whatsAppHref(raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""): string {
  return `https://wa.me/${whatsAppNumber(raw)}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}
