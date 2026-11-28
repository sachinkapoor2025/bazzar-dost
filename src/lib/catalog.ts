import "server-only";
import { api } from "@/lib/backend";
import { selectDailyDeals } from "@/lib/deals";
import { loadEngagementScores } from "@/lib/engagement";
import { loadSoldUnits } from "@/lib/sales";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES, parseRating, parseRupee, priceBounds } from "@/lib/commerce";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { listStoreReviews } from "@/lib/local-reviews";
import { loadReviewAverages } from "@/lib/product-review-store";
import {
  localByIds,
  localBySlugs,
  localCategories,
  localCategory,
  localBestSellers,
  localHome,
  localMostSearched,
  localProduct,
  localSectionQuery,
  localTrending,
  localQuery,
  localRelated,
  localTogether,
  localWholesale,
} from "@/lib/local-catalogue";
import type { CategoryLink, ProductCardData, Spec, VariantData } from "@/lib/types";

function remoteCatalogue(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}

async function readCatalogue<T>(remote: () => Promise<T>, local: () => T | Promise<T>): Promise<T> {
  if (!remoteCatalogue()) return local();
  try {
    return await remote();
  } catch (error) {
    console.error(error);
    return local();
  }
}

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  specifications: string;
  isActive: boolean;
  isFeatured: boolean;
  wholesaleEligible: boolean;
  minOrderQty: number | null;
  wholesalePrice: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  images: Array<{ id: string; url: string; alt: string; sortOrder: number }>;
  variants: VariantData[];
  category: { id: string; name: string; slug: string; parent: { name: string; slug: string } | null };
};

export function parseSpecs(raw: string): Spec[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as { label?: unknown; value?: unknown };
      if (typeof record.label !== "string" || typeof record.value !== "string") return [];
      return [{ label: record.label, value: record.value }];
    });
  } catch {
    return [];
  }
}

export function toCard(product: ProductRecord): ProductCardData {
  const bounds = priceBounds(product.price, product.variants.map((variant) => variant.price));
  const image = product.images[0];
  const stock = product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: bounds.price,
    compareAtPrice: bounds.from ? null : product.compareAtPrice,
    fromPrice: bounds.from,
    image: image?.url || "",
    imageAlt: image?.alt || product.name,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    inStock: stock > 0,
    stock,
    sku: product.sku,
    shortDescription: product.shortDescription,
    hasVariants: product.variants.length > 0,
    variants: product.variants,
  };
}

export type CatalogInput = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
  dealsOnly?: boolean;
  wholesaleOnly?: boolean;
  arrivalsOnly?: boolean;
  featuredOnly?: boolean;
  trendingOnly?: boolean;
  searchedOnly?: boolean;
  bestSellersOnly?: boolean;
  inStockOnly?: boolean;
  outOfStockOnly?: boolean;
  minRating?: number;
  take?: number;
};

export type CatalogResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  priceError?: string;
  outOfRange: boolean;
};

export async function searchCards(query: string, take = 6): Promise<ProductCardData[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const result = await readCatalogue(() => api<CatalogResult>("/catalog", { body: { q, take } }), () => localQuery({ q, take }));
  return result.items;
}

async function queryLocalCatalog(input: CatalogInput): Promise<CatalogResult> {
  const [sold, ratings, scores] = await Promise.all([loadSoldUnits(), loadReviewAverages(), loadEngagementScores()]);
  if (input.trendingOnly || input.searchedOnly) {
    return localSectionQuery(input.trendingOnly ? "trending" : "searched", input, scores, sold ?? new Map(), ratings);
  }
  return localQuery(input, sold ?? new Map(), ratings);
}

export async function queryCatalog(input: CatalogInput): Promise<CatalogResult> {
  if (input.minRating || input.featuredOnly || input.trendingOnly || input.searchedOnly) return queryLocalCatalog(input);
  return readCatalogue(() => api<CatalogResult>("/catalog", { body: input }), () => queryLocalCatalog(input));
}

export function readCatalogQuery(raw: Record<string, string | string[] | undefined>, defaults?: Partial<CatalogInput>): CatalogInput {
  const first = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number(first("page") || 1);
  return {
    q: first("q")?.trim() || defaults?.q,
    category: defaults?.category || first("category") || undefined,
    min: parseRupee(first("min")),
    max: parseRupee(first("max")),
    sort: first("sort") || defaults?.sort,
    page: Number.isFinite(page) ? page : 1,
    dealsOnly: defaults?.dealsOnly,
    wholesaleOnly: defaults?.wholesaleOnly,
    arrivalsOnly: defaults?.arrivalsOnly,
    featuredOnly: defaults?.featuredOnly,
    trendingOnly: defaults?.trendingOnly,
    searchedOnly: defaults?.searchedOnly,
    bestSellersOnly: defaults?.bestSellersOnly,
    inStockOnly: first("stock") === "in" || defaults?.inStockOnly,
    outOfStockOnly: first("stock") === "out",
    minRating: parseRating(first("rating")),
  };
}

const remembered = new Map<string, { at: number; value: unknown }>();

function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = remembered.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  return load().then((value) => {
    remembered.set(key, { at: Date.now(), value });
    return value;
  });
}

export async function getCategories(scope: "top" | "all" = "top"): Promise<CategoryLink[]> {
  return remember(`categories:${scope}`, 60_000, () =>
    readCatalogue(() => api<CategoryLink[]>(`/categories?scope=${scope}`), () => localCategories(scope)),
  );
}

export async function getCategory(slug: string) {
  return readCatalogue(
    () => api<{
      name: string;
      slug: string;
      description: string;
      parent: { name: string; slug: string; productCount?: number } | null;
      _count: { products: number };
      children: Array<{ slug: string; name: string; _count: { products: number } }>;
    }>(`/categories/${encodeURIComponent(slug)}`),
    () => localCategory(slug),
  );
}

export async function getProduct(slug: string): Promise<ProductRecord | null> {
  return readCatalogue(() => api<ProductRecord>(`/products/${encodeURIComponent(slug)}`), () => localProduct(slug));
}

export async function boughtTogether(productId: string): Promise<ProductCardData[]> {
  return readCatalogue(() => api<ProductCardData[]>(`/bought-together/${encodeURIComponent(productId)}`), () => localTogether(productId));
}

export async function relatedProducts(categoryId: string, productId: string): Promise<ProductCardData[]> {
  return readCatalogue(
    () => api<ProductCardData[]>(`/related/${encodeURIComponent(categoryId)}/${encodeURIComponent(productId)}`),
    () => localRelated(categoryId, productId),
  );
}

export async function getAnnouncement() {
  return remember("announcement", 60_000, loadAnnouncement);
}

async function loadAnnouncement() {
  try {
    const { liveAnnouncement } = await import("@/lib/admin-records");
    const live = await liveAnnouncement();
    if (live) return live;
  } catch (error) {
    console.error(error);
  }
  return {
    title: "Shipping at checkout",
    message: `Shipping is ₹${SHIPPING_FLAT_RUPEES}, and free when the payable product total reaches ₹${FREE_SHIPPING_ABOVE}.`,
    href: "/shipping-policy",
  };
}

export async function cardsWhere(_where: unknown, take = 24, _orderBy?: unknown): Promise<ProductCardData[]> {
  return readCatalogue(() => api<ProductCardData[]>(`/wholesale?take=${take}`), () => localWholesale(take));
}

function homeCard(card: ProductCardData): ProductCardData {
  return { ...card, variants: [], shortDescription: card.shortDescription.slice(0, 180) };
}

export async function getHomeData() {
  return remember("home", 60_000, loadHomeData);
}

async function loadHomeData() {
  const data = await readCatalogue(
    () => api<{
      categories: CategoryLink[];
      featured: ProductCardData[];
      arrivals: ProductCardData[];
      trending: ProductCardData[];
      deals: ProductCardData[];
      bestSellers: ProductCardData[];
      budget: { under199: ProductCardData[]; from200to499: ProductCardData[]; from500to999: ProductCardData[] };
      announcement: { title: string; message: string; href: string } | null;
      coupons: Array<{ id: string; code: string; type: string; value: number; minSubtotal: number }>;
      productCount: number;
    }>("/home"),
    () => localHome(),
  );
  const [scores, sold] = await Promise.all([loadEngagementScores(), loadSoldUnits()]);
  const trending = remoteCatalogue() && data.trending.length > 0
    ? { products: data.trending, ranked: true }
    : localTrending(scores);
  const searched = localMostSearched(scores);
  const bestSellers = remoteCatalogue() && data.bestSellers.length > 0
    ? { products: data.bestSellers, ranked: true }
    : localBestSellers(sold);
  const daily = selectDailyDeals(data.deals, new Date());
  const preview = (items: ProductCardData[]) => items.slice(0, 5).map(homeCard);
  return {
    ...data,
    featured: preview(data.featured),
    arrivals: preview(data.arrivals),
    trending: preview(trending.products),
    trendingRanked: trending.ranked,
    searched: preview(searched.products),
    searchedRanked: searched.ranked,
    bestSellers: preview(bestSellers.products),
    bestSellersRanked: bestSellers.ranked,
    deals: preview(daily.items),
    dealEndsAt: daily.endsAt,
  };
}

export async function productsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  return readCatalogue(() => api<ProductCardData[]>(`/products/by-slugs?slugs=${encodeURIComponent(slugs.join(","))}`), () => localBySlugs(slugs));
}

export async function getReviews() {
  if (databaseConfigured()) {
    const rows = await readDatabase([] as Array<{ id: string; name: string; city: string; rating: number; comment: string; createdAt: Date }>, (client) =>
      client.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, name: true, city: true, rating: true, comment: true, createdAt: true },
      }),
    );
    return rows
      .filter((row) => row.name.trim() && row.comment.trim())
      .map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }
  return readCatalogue(
    () => api<Array<{ id: string; name: string; city: string; rating: number; comment: string; createdAt: string }>>("/reviews"),
    () => listStoreReviews().filter((row) => row.name.trim() && row.comment.trim()),
  );
}

export async function productsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  return readCatalogue(() => api<ProductCardData[]>(`/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`), () => localByIds(ids));
}
