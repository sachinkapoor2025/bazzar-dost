import { discountPercent, NEW_ARRIVAL_DAYS, normalizePriceRange, PAGE_SIZE, priceBounds } from "./commerce";
import type { Category, HydratedProduct, Order, ProductCard } from "./types";

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
  outOfStockOnly?: boolean;
  minRating?: number;
  take?: number;
};

export function toCard(product: HydratedProduct): ProductCard {
  const bounds = priceBounds(product.price, product.variants.map((variant) => variant.price));
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

function textMatch(product: HydratedProduct, query: string): boolean {
  const term = query.toLowerCase();
  return [product.name, product.sku, product.shortDescription, product.description].some((value) =>
    value.toLowerCase().includes(term),
  );
}

export function salesByProduct(orders: Order[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      if (!item.productId) continue;
      map.set(item.productId, (map.get(item.productId) || 0) + item.qty);
    }
  }
  return map;
}

function isAvailable(product: HydratedProduct): boolean {
  return product.variants.length ? product.variants.some((variant) => variant.stock > 0) : product.stock > 0;
}

function unitsSold(sales: Map<string, number>, product: HydratedProduct): number {
  return sales.get(product.id) || sales.get(product.slug) || sales.get(`prod_${product.slug}`) || 0;
}

export function queryCatalog(
  products: HydratedProduct[],
  categories: Category[],
  sales: Map<string, number>,
  input: CatalogInput,
  ratings: Map<string, number> = new Map(),
) {
  const range = normalizePriceRange(input.min, input.max);
  if (range.error) return { items: [], total: 0, page: 1, pageCount: 1, priceError: range.error, outOfRange: false };

  let rows = products.filter((product) => product.isActive);
  if (input.category) {
    const category = categories.find((item) => item.slug === input.category);
    const slugs = category
      ? [category.slug, ...categories.filter((item) => item.parentId === category.id).map((item) => item.slug)]
      : [input.category];
    rows = rows.filter((product) => slugs.includes(product.category.slug));
  }
  if (input.wholesaleOnly) rows = rows.filter((product) => product.wholesaleEligible);
  if (input.arrivalsOnly) {
    const since = Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
    rows = rows.filter((product) => Date.parse(product.createdAt) >= since);
  }
  if (range.min != null) rows = rows.filter((product) => product.price >= range.min!);
  if (range.max != null) rows = rows.filter((product) => product.price <= range.max!);
  if (input.q) {
    const term = input.q.trim().toLowerCase().replace(/[%_]/g, "");
    rows = term ? rows.filter((product) => textMatch(product, term)) : [];
  }
  if (input.dealsOnly) {
    rows = rows.filter((product) => {
      const bounds = priceBounds(product.price, product.variants.map((variant) => variant.price));
      return !bounds.from && discountPercent(bounds.price, product.compareAtPrice) != null;
    });
  }
  if (input.bestSellersOnly) rows = rows.filter((product) => unitsSold(sales, product) > 0);
  if (input.inStockOnly) rows = rows.filter((product) => isAvailable(product));
  if (input.outOfStockOnly) rows = rows.filter((product) => !isAvailable(product));
  if (input.minRating) rows = rows.filter((product) => (ratings.get(product.slug) || 0) >= input.minRating!);

  const direction = input.sort || (input.bestSellersOnly ? "popular" : "newest");
  rows.sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    if (direction === "price-asc") return a.price - b.price || bTime - aTime;
    if (direction === "price-desc") return b.price - a.price || bTime - aTime;
    if (direction === "name") return a.name.localeCompare(b.name);
    if (direction === "popular") return unitsSold(sales, b) - unitsSold(sales, a) || bTime - aTime;
    return bTime - aTime;
  });

  const total = rows.length;
  if (input.take) return { items: rows.slice(0, input.take).map(toCard), total, page: 1, pageCount: 1, outOfRange: false };
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, input.page || 1);
  if (total > 0 && page > pageCount) return { items: [], total, page, pageCount, outOfRange: true };
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { items: slice.map(toCard), total, page, pageCount, outOfRange: false };
}

export function categoryLinks(categories: Category[], products: HydratedProduct[], scope: "top" | "all") {
  const own = new Map<string, number>();
  for (const category of categories) {
    own.set(category.id, products.filter((product) => product.isActive && product.categoryId === category.id).length);
  }
  const hasOwn = (id: string) => (own.get(id) || 0) > 0;
  const listed = categories.filter((category) => {
    if (!hasOwn(category.id)) return false;
    if (scope === "all") return true;
    if (!category.parentId) return true;
    return !hasOwn(category.parentId);
  });
  return listed
    .map((category) => {
      const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
      const childTotal = categories
        .filter((item) => item.parentId === category.id)
        .reduce((sum, child) => sum + (own.get(child.id) || 0), 0);
      return {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: (own.get(category.id) || 0) + childTotal,
        label: parent ? `${parent.name} · ${category.name}` : category.name,
      };
    })
    .sort((a, b) => (scope === "all" ? a.label.localeCompare(b.label) : 0));
}

export function categoryDetail(slug: string, categories: Category[], products: HydratedProduct[]) {
  const category = categories.find((item) => item.slug === slug);
  if (!category) return null;
  const count = (id: string) => products.filter((product) => product.isActive && product.categoryId === id).length;
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
  const children = categories
    .filter((item) => item.parentId === category.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((child) => ({ id: child.id, name: child.name, slug: child.slug, _count: { products: count(child.id) } }));
  return {
    ...category,
    parent: parent ? { name: parent.name, slug: parent.slug, productCount: count(parent.id) } : null,
    _count: { products: count(category.id) },
    children,
  };
}

export function relatedProducts(categoryId: string, productId: string, categories: Category[], products: HydratedProduct[]): ProductCard[] {
  const category = categories.find((item) => item.id === categoryId);
  const familyIds = category?.parentId
    ? categories.filter((item) => item.id === category.parentId || item.parentId === category.parentId).map((item) => item.id)
    : [categoryId];
  return products
    .filter((product) => product.isActive && product.id !== productId && familyIds.includes(product.categoryId))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 4)
    .map(toCard);
}

export function boughtTogether(productId: string, orders: Order[], products: HydratedProduct[]): ProductCard[] {
  const orderIds = new Set(
    orders.filter((order) => order.status !== "cancelled" && order.items.some((item) => item.productId === productId)).map((order) => order.id),
  );
  const counts = new Map<string, number>();
  for (const order of orders) {
    if (!orderIds.has(order.id)) continue;
    for (const item of order.items) {
      if (!item.productId || item.productId === productId) continue;
      counts.set(item.productId, (counts.get(item.productId) || 0) + item.qty);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .flatMap(([id]) => {
      const product = products.find((item) => item.id === id && item.isActive);
      return product ? [toCard(product)] : [];
    });
}
