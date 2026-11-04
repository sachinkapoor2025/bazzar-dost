"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product-card";
import { formatCountdown } from "@/lib/deals";
import type { ProductCardData } from "@/lib/types";

export function DailyDeals({
  endsAt,
  products,
  children,
}: {
  endsAt: string | null;
  products: ProductCardData[];
  children?: React.ReactNode;
}) {
  const end = endsAt ? Date.parse(endsAt) : Number.NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(end)) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);

  const remaining = Number.isFinite(end) ? end - now : null;
  const expired = remaining != null && remaining <= 0;
  const showDeals = products.length > 0 && !expired;

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        Reduced prices are shown only when a compare-at price on the product is higher.
        {showDeals && remaining != null ? (
          <span className="ml-2 font-semibold tabular-nums text-forest-900" aria-live="polite" data-ends-at={endsAt ?? ""} suppressHydrationWarning>
            Ends in {formatCountdown(remaining)}
          </span>
        ) : null}
      </p>
      {children}
      {showDeals ? <ProductGrid products={products} /> : null}
      {!showDeals && !children ? <p className="text-sm text-muted">No reduced prices or coupons are active right now.</p> : null}
    </>
  );
}
