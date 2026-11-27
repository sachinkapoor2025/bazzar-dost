export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

export function analyticsConfigured(): boolean {
  return Boolean(GA_MEASUREMENT_ID || META_PIXEL_ID);
}
