import "server-only";
import { prisma } from "@/lib/db";
import { NEW_ARRIVAL_DAYS, PAGE_SIZE, discountPercent, normalizePriceRange, parseRupee, priceBounds } from "@/lib/commerce";
import type { CategoryLink, ProductCardData, Spec } from "@/lib/types";
import type { Prisma } from "@prisma/client";

const include = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { name: "asc" as const } },
  category: { include: { parent: { select: { name: true, slug: true } } } },
} satisfies Prisma.ProductInclude;

export type ProductRecord = Prisma.ProductGetPayload<{ include: typeof include }>;

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
  const bounds = priceBounds(
    product.price,
    product.variants.map((variant) => variant.price),
  );
  const image = product.images[0];
  const stock = product.variants.length
    ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;
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
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      image: variant.image,
    })),
  };
}

async function hydrate(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include });
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [toCard(product)] : [];
  });
}

async function salesByProduct(): Promise<Map<string, number>> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { status: { not: "cancelled" } } },
    _sum: { qty: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (row.productId) map.set(row.productId, row._sum.qty || 0);
  }
  return map;
}

async function searchIds(query: string): Promise<string[]> {
  const term = `%${query.toLowerCase().replace(/[%_]/g, "")}%`;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Product
    WHERE isActive = 1 AND (
      lower(name) LIKE ${term}
      OR lower(sku) LIKE ${term}
      OR lower(shortDescription) LIKE ${term}
      OR lower(description) LIKE ${term}
    )
  `;
  return rows.map((row) => row.id);
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
  bestSellersOnly?: boolean;
  inStockOnly?: boolean;
};

export type CatalogResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  priceError?: string;
  outOfRange: boolean;
};

export async function queryCatalog(input: CatalogInput): Promise<CatalogResult> {
  const range = normalizePriceRange(input.min, input.max);
  if (range.error) {
    return { items: [], total: 0, page: 1, pageCount: 1, priceError: range.error, outOfRange: false };
  }

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (input.category) {
    const category = await prisma.category.findUnique({
      where: { slug: input.category },
      include: { children: { select: { slug: true } } },
    });
    const slugs = category ? [category.slug, ...category.children.map((child) => child.slug)] : [input.category];
    where.category = { slug: { in: slugs } };
  }
  if (input.wholesaleOnly) where.wholesaleEligible = true;
  if (input.arrivalsOnly) {
    const since = new Date(Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }
  if (range.min != null || range.max != null) {
    where.price = {};
    if (range.min != null) where.price.gte = range.min;
    if (range.max != null) where.price.lte = range.max;
  }
  if (input.q) {
    const ids = await searchIds(input.q);
    where.id = { in: ids };
  }

  const rows = await prisma.product.findMany({
    where,
    select: {
      id: true,
      price: true,
      compareAtPrice: true,
      createdAt: true,
      stock: true,
      variants: { select: { price: true, stock: true } },
    },
  });
  let filtered = rows;
  if (input.dealsOnly) {
    filtered = filtered.filter((row) => {
      const bounds = priceBounds(row.price, row.variants.map((variant) => variant.price));
      return !bounds.from && discountPercent(bounds.price, row.compareAtPrice) != null;
    });
  }
  const sales = input.bestSellersOnly || input.sort === "popular" ? await salesByProduct() : new Map<string, number>();
  if (input.bestSellersOnly) {
    filtered = filtered.filter((row) => (sales.get(row.id) || 0) > 0);
  }
  if (input.inStockOnly) {
    filtered = filtered.filter((row) => (row.variants.length ? row.variants.some((variant) => variant.stock > 0) : row.stock > 0));
  }

  const direction = input.sort || (input.bestSellersOnly ? "popular" : "newest");
  filtered.sort((a, b) => {
    if (direction === "price-asc") return a.price - b.price || b.createdAt.getTime() - a.createdAt.getTime();
    if (direction === "price-desc") return b.price - a.price || b.createdAt.getTime() - a.createdAt.getTime();
    if (direction === "popular") {
      return (sales.get(b.id) || 0) - (sales.get(a.id) || 0) || b.createdAt.getTime() - a.createdAt.getTime();
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, input.page || 1);
  if (total > 0 && page > pageCount) {
    return { items: [], total, page, pageCount, outOfRange: true };
  }
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const items = await hydrate(slice.map((row) => row.id));
  return { items, total, page, pageCount, outOfRange: false };
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
    bestSellersOnly: defaults?.bestSellersOnly,
    inStockOnly: first("stock") === "in" || defaults?.inStockOnly,
  };
}

export async function getCategories(scope: "top" | "all" = "top"): Promise<CategoryLink[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { name: true } },
      children: { select: { id: true } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  const own = new Map(categories.map((category) => [category.id, category._count.products]));
  const listed = scope === "top" ? categories.filter((category) => !category.parentId) : categories;
  return listed
    .map((category) => {
      const childTotal = category.children.reduce((sum, child) => sum + (own.get(child.id) || 0), 0);
      return {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: category._count.products + childTotal,
        label: category.parent ? `${category.parent.name} · ${category.name}` : category.name,
      };
    })
    .filter((category) => category.productCount > 0)
    .sort((a, b) => (scope === "all" ? a.label.localeCompare(b.label) : 0));
}

export async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
      _count: { select: { products: { where: { isActive: true } } } },
      children: {
        orderBy: { name: "asc" },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      },
    },
  });
}

export async function getProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include,
  });
  return product;
}

export async function boughtTogether(productId: string): Promise<ProductCardData[]> {
  const lines = await prisma.orderItem.findMany({
    where: { productId, order: { status: { not: "cancelled" } } },
    select: { orderId: true },
    take: 40,
  });
  const orderIds = lines.map((line) => line.orderId);
  if (orderIds.length === 0) return [];
  const companions = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds }, productId: { not: productId } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 3,
  });
  const ids = companions.map((row) => row.productId).filter((id): id is string => Boolean(id));
  return productsByIds(ids);
}

export async function relatedProducts(categoryId: string, productId: string): Promise<ProductCardData[]> {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { parentId: true } });
  const family = category?.parentId
    ? await prisma.category.findMany({
        where: { OR: [{ id: category.parentId }, { parentId: category.parentId }] },
        select: { id: true },
      })
    : [{ id: categoryId }];
  const products = await prisma.product.findMany({
    where: { categoryId: { in: family.map((item) => item.id) }, isActive: true, id: { not: productId } },
    include,
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return products.map(toCard);
}

export async function getAnnouncement() {
  const now = new Date();
  const items = await prisma.promotion.findMany({
    where: { active: true, kind: "announcement" },
    orderBy: { createdAt: "desc" },
  });
  return (
    items.find((item) => (!item.startsAt || item.startsAt <= now) && (!item.endsAt || item.endsAt >= now)) || null
  );
}

export async function cardsWhere(where: Prisma.ProductWhereInput, take: number, orderBy: Prisma.ProductOrderByWithRelationInput): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({ where, include, take, orderBy });
  return products.map(toCard);
}

export async function getHomeData() {
  const since = new Date(Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000);
  const [categories, featured, arrivals, trending, priced, announcement, activeCoupons] = await Promise.all([
    getCategories(),
    cardsWhere({ isActive: true, isFeatured: true }, 8, { createdAt: "desc" }),
    cardsWhere({ isActive: true, createdAt: { gte: since } }, 8, { createdAt: "desc" }),
    cardsWhere({ isActive: true, viewCount: { gt: 0 } }, 8, { viewCount: "desc" }),
    prisma.product.findMany({
      where: { isActive: true, price: { lte: 999 } },
      include,
      orderBy: { price: "asc" },
    }),
    getAnnouncement(),
    prisma.coupon.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);
  const best = await queryCatalog({ bestSellersOnly: true, page: 1 });
  const deals = (await prisma.product.findMany({
    where: { isActive: true, compareAtPrice: { not: null } },
    include,
    orderBy: { createdAt: "desc" },
  }))
    .map(toCard)
    .filter((card) => discountPercent(card.price, card.compareAtPrice) != null)
    .slice(0, 8);
  const affordable = priced.map(toCard);
  return {
    categories,
    featured,
    arrivals,
    trending,
    deals,
    bestSellers: best.items.slice(0, 8),
    budget: {
      under199: affordable.filter((product) => product.price <= 199).slice(0, 4),
      from200to499: affordable.filter((product) => product.price >= 200 && product.price <= 499).slice(0, 4),
      from500to999: affordable.filter((product) => product.price >= 500 && product.price <= 999).slice(0, 4),
    },
    announcement,
    coupons: activeCoupons.filter((coupon) => !coupon.expiresAt || coupon.expiresAt >= new Date()),
    productCount: await prisma.product.count({ where: { isActive: true } }),
  };
}

export async function productsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  const unique = [...new Set(slugs)].slice(0, 12);
  const products = await prisma.product.findMany({ where: { slug: { in: unique }, isActive: true }, include });
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return unique.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [toCard(product)] : [];
  });
}

export async function productsByIds(ids: string[]): Promise<ProductCardData[]> {
  const unique = [...new Set(ids)].slice(0, 50);
  const products = await prisma.product.findMany({ where: { id: { in: unique }, isActive: true }, include });
  const byId = new Map(products.map((product) => [product.id, product]));
  return unique.flatMap((id) => {
    const product = byId.get(id);
    return product ? [toCard(product)] : [];
  });
}
