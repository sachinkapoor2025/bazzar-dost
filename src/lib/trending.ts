export type EngagementScore = {
  views: number;
  clicks: number;
  orders: number;
  wishlists: number;
};

export type TrendCandidate = {
  slug: string;
  name: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  categoryId: string;
  variants: Array<{ stock: number }>;
};

export function emptyScore(): EngagementScore {
  return { views: 0, clicks: 0, orders: 0, wishlists: 0 };
}

export function engagementPoints(score: EngagementScore | undefined): number {
  if (!score) return 0;
  return score.views + score.clicks + score.orders + score.wishlists;
}

export function availableUnits(product: Pick<TrendCandidate, "stock" | "variants">): number {
  if (product.variants.length > 0) return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  return product.stock;
}

function byName(a: TrendCandidate, b: TrendCandidate): number {
  return a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug);
}

/** In-stock products from the fullest departments, so the grid stays varied when nobody has been tracked yet. */
export function popularAvailable<T extends TrendCandidate>(products: T[], take: number): T[] {
  const groups = new Map<string, T[]>();
  for (const product of products) {
    if (!product.isActive || availableUnits(product) <= 0) continue;
    const list = groups.get(product.categoryId) || [];
    list.push(product);
    groups.set(product.categoryId, list);
  }
  for (const list of groups.values()) list.sort(byName);
  const departments = [...groups.values()].sort((a, b) => b.length - a.length || byName(a[0], b[0]));
  const picked: T[] = [];
  let round = 0;
  while (picked.length < take) {
    let added = false;
    for (const department of departments) {
      if (picked.length >= take) break;
      const product = department[round];
      if (!product) continue;
      picked.push(product);
      added = true;
    }
    if (!added) break;
    round += 1;
  }
  return picked;
}

export function rankTrending<T extends TrendCandidate>(
  products: T[],
  scores: Map<string, EngagementScore>,
  take = 8,
): { items: T[]; ranked: boolean } {
  const active = products.filter((product) => product.isActive);
  const engaged = active
    .map((product) => ({ product, score: scores.get(product.slug) || emptyScore() }))
    .filter((row) => engagementPoints(row.score) > 0)
    .sort((a, b) => {
      const points = engagementPoints(b.score) - engagementPoints(a.score);
      if (points !== 0) return points;
      return (
        b.score.views - a.score.views ||
        b.score.clicks - a.score.clicks ||
        b.score.orders - a.score.orders ||
        b.score.wishlists - a.score.wishlists ||
        byName(a.product, b.product)
      );
    });

  if (engaged.length === 0) return { items: popularAvailable(active, take), ranked: false };

  const items = engaged.slice(0, take).map((row) => row.product);
  if (items.length < take) {
    const seen = new Set(items.map((product) => product.slug));
    for (const product of popularAvailable(active, take)) {
      if (items.length >= take) break;
      if (seen.has(product.slug)) continue;
      items.push(product);
    }
  }
  return { items, ranked: true };
}

export function rankBestSellers<T extends TrendCandidate>(
  products: T[],
  sold: Map<string, number> | null,
  take = 8,
): { items: T[]; ranked: boolean } {
  const active = products.filter((product) => product.isActive);
  const ranked = active
    .map((product) => ({ product, qty: sold?.get(product.slug) || 0 }))
    .filter((row) => row.qty > 0)
    .sort((a, b) => b.qty - a.qty || byName(a.product, b.product));

  if (ranked.length > 0) return { items: ranked.slice(0, take).map((row) => row.product), ranked: true };

  const pool = popularAvailable(active, take * 2);
  const later = pool.slice(take);
  if (later.length >= take) return { items: later.slice(0, take), ranked: false };
  const items = [...later];
  const seen = new Set(items.map((product) => product.slug));
  for (const product of pool) {
    if (items.length >= take) break;
    if (seen.has(product.slug)) continue;
    items.push(product);
    seen.add(product.slug);
  }
  return { items, ranked: false };
}
