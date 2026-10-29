"use client";

import { formatMoney } from "@/lib/money";
import { usePreferences } from "@/components/preferences-provider";

export function Money({ amount }: { amount: number }) {
  const { currency } = usePreferences();
  return <>{formatMoney(amount, currency)}</>;
}
