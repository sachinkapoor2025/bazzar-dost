"use client";

import { usePreferences } from "@/components/preferences-provider";
import { discountPercent, showCompareAt } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";

export function Price({
  price,
  compareAt,
  from = false,
  basePrice,
}: {
  price: number;
  compareAt?: number | null;
  from?: boolean;
  basePrice?: number;
}) {
  const { currency } = usePreferences();
  const compare = from ? null : showCompareAt(price, basePrice ?? price, compareAt);
  const discount = compare ? discountPercent(price, compare) : null;
  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className="font-semibold text-ink">
        {from ? "From " : ""}
        {formatMoney(price, currency)}
      </span>
      {compare && discount ? (
        <>
          <s className="text-sm text-muted">{formatMoney(compare, currency)}</s>
          <span className="rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-forest-900">{discount}% off</span>
        </>
      ) : null}
    </p>
  );
}
