import { discountPercent } from "@/lib/commerce";

const STORE_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type DealCard = {
  price: number;
  compareAtPrice: number | null;
  fromPrice?: boolean;
};

export function endOfStoreDay(now: Date): Date {
  const shifted = new Date(now.getTime() + STORE_OFFSET_MS);
  const startUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(startUtc + 24 * 60 * 60 * 1000 - STORE_OFFSET_MS);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function dealIsOpen(now: Date, endsAt: Date): boolean {
  return now.getTime() < endsAt.getTime();
}

export function selectDailyDeals<T extends DealCard>(products: T[], now: Date, take = 8): { items: T[]; endsAt: string | null } {
  const endsAt = endOfStoreDay(now);
  if (!dealIsOpen(now, endsAt)) return { items: [], endsAt: null };
  const items = products
    .filter((product) => !product.fromPrice && discountPercent(product.price, product.compareAtPrice) != null)
    .slice(0, take);
  return { items, endsAt: items.length > 0 ? endsAt.toISOString() : null };
}
