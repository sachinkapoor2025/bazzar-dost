export const CURRENCIES = [
  { code: "INR", label: "Indian rupee", perRupee: 1, digits: 0 },
  { code: "USD", label: "US dollar", perRupee: 1 / 84, digits: 2 },
  { code: "EUR", label: "Euro", perRupee: 1 / 91, digits: 2 },
  { code: "GBP", label: "British pound", perRupee: 1 / 110, digits: 2 },
  { code: "AED", label: "UAE dirham", perRupee: 1 / 23, digits: 2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value);
}

export function formatMoney(rupees: number, code: CurrencyCode = "INR"): string {
  const currency = CURRENCIES.find((item) => item.code === code) || CURRENCIES[0];
  const amount = code === "INR" ? rupees : rupees * currency.perRupee;
  return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: currency.digits,
    maximumFractionDigits: currency.digits,
  }).format(amount);
}
