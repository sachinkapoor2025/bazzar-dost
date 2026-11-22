import "server-only";
import { DEFAULT_GST, DEFAULT_SHIPPING, gstSettingsSchema, shippingSettingsSchema, type GstSettings, type ShippingSettings } from "@/lib/admin-record-schema";
import { readSingleton, saveSingleton } from "@/lib/admin-records";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { rulesFromEnv, type DeliveryRules } from "@/lib/delivery";

function fallbackShipping(): ShippingSettings {
  return { ...DEFAULT_SHIPPING, flat: SHIPPING_FLAT_RUPEES, freeAbove: FREE_SHIPPING_ABOVE };
}

export async function loadShippingSettings(): Promise<ShippingSettings> {
  try {
    const saved = await readSingleton("shipping");
    const parsed = shippingSettingsSchema.safeParse({ ...fallbackShipping(), ...(saved || {}) });
    return parsed.success ? parsed.data : fallbackShipping();
  } catch (error) {
    console.error(error);
    return fallbackShipping();
  }
}

export async function saveShippingSettings(input: unknown): Promise<ShippingSettings> {
  const data = shippingSettingsSchema.parse(input);
  if (data.minDays && data.maxDays && Number(data.maxDays) < Number(data.minDays)) {
    const error = new Error("The latest delivery day must be on or after the earliest.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  if (data.festivalStart && data.festivalEnd && data.festivalEnd < data.festivalStart) {
    const error = new Error("The festival end date must be on or after the start date.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  await saveSingleton("shipping", "Shipping", data);
  return data;
}

export async function loadShippingPricing(): Promise<{ flat: number; freeAbove: number }> {
  const settings = await loadShippingSettings();
  return { flat: settings.flat, freeAbove: settings.freeAbove };
}

export async function loadDeliveryRules(): Promise<DeliveryRules> {
  const settings = await loadShippingSettings();
  const env = rulesFromEnv();
  return {
    blockedPrefixes: settings.blockedPrefixes || env.blockedPrefixes,
    allowedPrefixes: settings.allowedPrefixes || env.allowedPrefixes,
    minDays: settings.minDays || env.minDays,
    maxDays: settings.maxDays || env.maxDays,
  };
}

export async function loadGstSettings(): Promise<GstSettings> {
  try {
    const saved = await readSingleton("gst");
    const parsed = gstSettingsSchema.safeParse({ ...DEFAULT_GST, ...(saved || {}) });
    return parsed.success ? parsed.data : DEFAULT_GST;
  } catch (error) {
    console.error(error);
    return DEFAULT_GST;
  }
}

export async function saveGstSettings(input: unknown): Promise<GstSettings> {
  const data = gstSettingsSchema.parse(input);
  await saveSingleton("gst", "GST", data);
  return data;
}
