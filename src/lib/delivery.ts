import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";

export type DeliveryRules = {
  blockedPrefixes?: string;
  allowedPrefixes?: string;
  minDays?: string;
  maxDays?: string;
};

export type DeliveryCheck = {
  ok: boolean;
  available: boolean;
  estimate: string | null;
  message: string;
};

function prefixes(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^\d{1,6}$/.test(value));
}

function configuredEstimate(minRaw: string | undefined, maxRaw: string | undefined): string | null {
  if (!minRaw || !maxRaw || !/^\d{1,2}$/.test(minRaw.trim()) || !/^\d{1,2}$/.test(maxRaw.trim())) return null;
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (min < 1 || max < min || max > 60) return null;
  if (min === max) return `${min} day${min === 1 ? "" : "s"}`;
  return `${min}–${max} days`;
}

function shippingLine(): string {
  return `Shipping is ${formatINR(SHIPPING_FLAT_RUPEES)}, or free when the payable product total reaches ${formatINR(FREE_SHIPPING_ABOVE)}.`;
}

export function rulesFromEnv(env: NodeJS.ProcessEnv = process.env): DeliveryRules {
  return {
    blockedPrefixes: env.DELIVERY_BLOCKED_PREFIXES,
    allowedPrefixes: env.DELIVERY_ALLOWED_PREFIXES,
    minDays: env.DELIVERY_MIN_DAYS,
    maxDays: env.DELIVERY_MAX_DAYS,
  };
}

export function checkPincode(raw: string, rules: DeliveryRules = rulesFromEnv()): DeliveryCheck {
  const pin = raw.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return { ok: false, available: false, estimate: null, message: "Enter a valid 6-digit PIN code." };
  }
  const blocked = prefixes(rules.blockedPrefixes);
  const allowed = prefixes(rules.allowedPrefixes);
  const blockedHit = blocked.some((prefix) => pin.startsWith(prefix));
  const allowedHit = allowed.length === 0 || allowed.some((prefix) => pin.startsWith(prefix));
  if (blockedHit || !allowedHit) {
    return {
      ok: true,
      available: false,
      estimate: null,
      message: "Delivery is not available for this PIN code.",
    };
  }
  const estimate = configuredEstimate(rules.minDays, rules.maxDays);
  if (!estimate) {
    return {
      ok: true,
      available: true,
      estimate: null,
      message: `This PIN can be used at checkout. ${shippingLine()} A delivery date is not published for this PIN.`,
    };
  }
  return {
    ok: true,
    available: true,
    estimate,
    message: `Delivery is available for this PIN code. The store's configured estimate is ${estimate} after the order is placed. ${shippingLine()}`,
  };
}
