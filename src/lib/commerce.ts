export const SHIPPING_FLAT_RUPEES = 49;
export const FREE_SHIPPING_ABOVE = 999;
export const MAX_LINE_QTY = 10;
export const NEW_ARRIVAL_DAYS = 90;
export const PAGE_SIZE = 12;

export type CouponRule = {
  type: string;
  value: number;
  minSubtotal: number;
};

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (compareAt == null || compareAt <= price || price < 0) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function shippingCharge(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_ABOVE) return 0;
  return SHIPPING_FLAT_RUPEES;
}

export function couponDiscount(subtotal: number, coupon: CouponRule | null): number {
  if (!coupon || subtotal <= 0) return 0;
  if (subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === "PERCENT") {
    const percent = Math.min(90, Math.max(0, coupon.value));
    return Math.min(subtotal, Math.round((subtotal * percent) / 100));
  }
  if (coupon.type === "FIXED") {
    return Math.min(subtotal, Math.max(0, coupon.value));
  }
  return 0;
}

export function orderTotal(subtotal: number, discount: number, shipping: number): number {
  return Math.max(0, subtotal - discount) + Math.max(0, shipping);
}

export function sellingPrice(basePrice: number, variantPrice: number | null | undefined): number {
  return variantPrice == null ? basePrice : variantPrice;
}

export function priceBounds(basePrice: number, variantPrices: Array<number | null | undefined>): { price: number; from: boolean } {
  if (variantPrices.length === 0) return { price: basePrice, from: false };
  const prices = variantPrices.map((price) => sellingPrice(basePrice, price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { price: min, from: min !== max };
}

export function showCompareAt(unitPrice: number, basePrice: number, compareAt: number | null | undefined): number | null {
  if (unitPrice !== basePrice) return null;
  if (discountPercent(unitPrice, compareAt) == null) return null;
  return compareAt ?? null;
}

export function normalizePriceRange(
  min: number | undefined,
  max: number | undefined,
): { min?: number; max?: number; error?: string } {
  if (min != null && max != null && min > max) {
    return { error: "Minimum price must be less than or equal to maximum price." };
  }
  return { min, max };
}

export function parseRupee(value: string | undefined): number | undefined {
  if (!value || !/^\d{1,7}$/.test(value)) return undefined;
  return Number(value);
}

export function safeNextPath(value: string | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  return value;
}
