import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  boughtTogether as togetherCards,
  categoryDetail,
  categoryLinks,
  queryCatalog as queryRows,
  relatedProducts as relatedCards,
  toCard,
  type CatalogInput,
} from "../../apps/api/src/lib/catalog-query";
import type { Category, HydratedProduct } from "../../apps/api/src/lib/types";
import { categories as starterCategories } from "../../apps/api/src/starter-catalog";
import shopifyCatalogueJson from "@/data/shopify-catalogue.json";
import { MAX_LINE_QTY, PAGE_SIZE, sellingPrice } from "@/lib/commerce";
import { displayImages, duplicateListingIds, isLoadableProductImage } from "@/lib/product-images";
import { rankBestSellers, rankMostSearched, rankTrending, type EngagementScore } from "@/lib/trending";

// The JSON file stores an empty variants array on every product, so TypeScript
// infers that array as never[]. Name the catalogue shape explicitly.
type ShopifyCatalogue = {
  categories: Array<{
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
    parentSlug: string | null;
    image: string;
  }>;
  products: Array<{
    slug: string;
    name: string;
    sku: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    categorySlug: string;
    specifications: string[][];
    images: Array<{ url: string; alt: string }>;
    variants: Array<{ name: string; sku: string; price: number | null; stock: number }>;
  }>;
};

const shopifyCatalogue = shopifyCatalogueJson as ShopifyCatalogue;

const builtAt = Date.now();

function categoryView(category: Category, categories: Category[]): HydratedProduct["category"] {
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: parent ? { name: parent.name, slug: parent.slug } : null,
  };
}

function repairCategoryImages(categories: Category[], products: HydratedProduct[]) {
  const childIds = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = childIds.get(category.parentId) ?? [];
    list.push(category.id);
    childIds.set(category.parentId, list);
  }
  for (const category of categories) {
    if (isLoadableProductImage(category.image)) continue;
    const ids = new Set([category.id, ...(childIds.get(category.id) ?? [])]);
    const source = products.find((product) => product.isActive && ids.has(product.categoryId));
    const image = source?.images.find((item) => isLoadableProductImage(item.url));
    if (image) category.image = image.url;
  }
}

function buildCatalogue(): { categories: Category[]; products: HydratedProduct[] } {
  const categories: Category[] = starterCategories.map(([slug, name, description, sortOrder]) => ({
    id: `cat_${slug}`,
    name,
    slug,
    description,
    image: `/media/categories/${slug}.svg`,
    sortOrder,
    parentId: null,
  }));
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  for (const extra of shopifyCatalogue.categories) {
    const existing = bySlug.get(extra.slug);
    if (existing) {
      if (extra.image) existing.image = extra.image;
      continue;
    }
    const category: Category = {
      id: `cat_${extra.slug}`,
      name: extra.name,
      slug: extra.slug,
      description: extra.description,
      image: extra.image || "/media/categories/home-kitchen.svg",
      sortOrder: extra.sortOrder,
      parentId: extra.parentSlug ? `cat_${extra.parentSlug}` : null,
    };
    categories.push(category);
    bySlug.set(extra.slug, category);
  }
  // Demo seed products only have generated green placeholder art and are not in the
  // supplier catalogue. They stay in the seed file, and are left out of the storefront.
  const imported = shopifyCatalogue.products.map((product, index) => {
    const category = bySlug.get(product.categorySlug);
    if (!category) throw new Error(`Catalogue product ${product.slug} has no category.`);
    const createdAt = new Date(builtAt - index * 60 * 1000).toISOString();
    const images = displayImages(product.images).map((image, imageIndex) => ({
      id: `img_${product.slug}_${imageIndex}`,
      url: image.url,
      alt: image.alt || product.name,
      sortOrder: imageIndex,
    }));
    return {
      id: `prod_${product.slug}`,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.variants.length ? 0 : product.stock,
      categoryId: category.id,
      specifications: JSON.stringify(product.specifications.map((pair) => ({ label: pair[0] ?? "", value: pair[1] ?? "" }))),
      isActive: images.length > 0,
      isFeatured: false,
      wholesaleEligible: false,
      minOrderQty: null,
      wholesalePrice: null,
      viewCount: 0,
      createdAt,
      updatedAt: createdAt,
      images,
      variants: product.variants.map((variant) => ({
        id: `var_${variant.sku}`,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        image: "",
      })),
      version: 1,
      category: categoryView(category, categories),
    } satisfies HydratedProduct;
  });
  const hidden = duplicateListingIds(
    imported.filter((product) => product.isActive).map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
    })),
  );
  for (const product of imported) {
    if (hidden.has(product.id)) product.isActive = false;
  }
  repairCategoryImages(categories, imported);
  return { categories, products: imported };
}

const catalogue = buildCatalogue();
const STOCK_FILE = path.join(process.cwd(), "data", "stock.json");

function readStockOverlay(): Record<string, number> {
  try {
    const parsed = JSON.parse(fs.readFileSync(STOCK_FILE, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const overlay: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isInteger(value) && value >= 0) overlay[key] = value;
    }
    return overlay;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : "";
    if (code !== "ENOENT") console.error(error);
    return {};
  }
}

function writeStockOverlay(overlay: Record<string, number>) {
  fs.mkdirSync(path.dirname(STOCK_FILE), { recursive: true });
  const tmp = `${STOCK_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(overlay));
  fs.copyFileSync(tmp, STOCK_FILE);
  fs.unlinkSync(tmp);
}

function applyStockOverlay() {
  const overlay = readStockOverlay();
  for (const product of catalogue.products) {
    if (overlay[product.id] != null) product.stock = overlay[product.id];
    for (const variant of product.variants) {
      if (overlay[variant.id] != null) variant.stock = overlay[variant.id];
    }
  }
}

applyStockOverlay();

export function findLocalProduct(id: string) {
  return catalogue.products.find((product) => product.id === id) ?? null;
}

export function changeLocalStock(productId: string, variantId: string | null, delta: number): boolean {
  const product = findLocalProduct(productId);
  if (!product || !Number.isInteger(delta)) return false;
  const overlay = readStockOverlay();
  if (variantId) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant || variant.stock + delta < 0) return false;
    variant.stock += delta;
    overlay[variant.id] = variant.stock;
  } else {
    if (product.stock + delta < 0) return false;
    product.stock += delta;
    overlay[product.id] = product.stock;
  }
  writeStockOverlay(overlay);
  return true;
}

export function setLocalStock(productId: string, variantId: string | null, stock: number): boolean {
  const product = findLocalProduct(productId);
  if (!product || !Number.isInteger(stock) || stock < 0) return false;
  if (variantId) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return false;
    return changeLocalStock(productId, variantId, stock - variant.stock);
  }
  return changeLocalStock(productId, null, stock - product.stock);
}

function unitsInStock(product: HydratedProduct) {
  return product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;
}

export function listAdminCatalogueProducts(input: {
  q?: string;
  category?: string;
  active?: string;
  stock?: string;
  sort?: string;
  page: number;
  pageSize: number;
}) {
  const needle = input.q?.trim().toLowerCase() || "";
  const byId = new Map(catalogue.categories.map((category) => [category.id, category]));
  const rows = catalogue.products.filter((product) => {
    const category = byId.get(product.categoryId);
    if (needle && !`${product.name} ${product.sku} ${category?.name || ""}`.toLowerCase().includes(needle)) return false;
    if (input.category && category?.slug !== input.category) return false;
    if (input.active === "yes" && !product.isActive) return false;
    if (input.active === "no" && product.isActive) return false;
    const stock = unitsInStock(product);
    if (input.stock === "out" && stock !== 0) return false;
    if (input.stock === "low" && !(stock > 0 && stock <= 5)) return false;
    return true;
  });
  const sort = input.sort || "name";
  rows.sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price || a.name.localeCompare(b.name);
    if (sort === "price-desc") return b.price - a.price || a.name.localeCompare(b.name);
    if (sort === "stock") return unitsInStock(a) - unitsInStock(b) || a.name.localeCompare(b.name);
    if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return a.name.localeCompare(b.name);
  });
  const start = (Math.max(1, input.page) - 1) * input.pageSize;
  return {
    categories: [...byId.values()].map((category) => ({ slug: category.slug, name: category.name })).sort((a, b) => a.name.localeCompare(b.name)),
    total: rows.length,
    products: rows.slice(start, start + input.pageSize).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: byId.get(product.categoryId)?.name || "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: unitsInStock(product),
      active: product.isActive,
    })),
  };
}

export function listAdminCatalogueCategories(query = "") {
  const needle = query.trim().toLowerCase();
  const categories = catalogue.categories
    .filter((category) => !needle || category.name.toLowerCase().includes(needle) || category.slug.includes(needle))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((category) => ({
      ...category,
      _count: { products: catalogue.products.filter((product) => product.categoryId === category.id).length },
    }));
  const parents = catalogue.categories
    .map((category) => ({ id: category.id, name: category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { categories, parents };
}

export function listCatalogueFeaturedChoices(take = 80) {
  return catalogue.products
    .filter((product) => product.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, take)
    .map((product) => ({ id: product.id, name: product.name, isFeatured: product.isFeatured }));
}

export function localInventory(query: string, take = 200) {
  const needle = query.trim().toLowerCase();
  return catalogue.products
    .filter((product) => product.isActive && (!needle || product.name.toLowerCase().includes(needle) || product.sku.toLowerCase().includes(needle)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, take);
}

export function localActiveProductCount() {
  return catalogue.products.filter((product) => product.isActive).length;
}

export function localLowStock(limit = 8) {
  return catalogue.products
    .filter((product) => product.isActive && (product.variants.length === 0 ? product.stock <= 5 : product.variants.some((variant) => variant.stock <= 5)))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit);
}

export function localCategoryOptions() {
  return catalogue.categories
    .map((category) => ({ slug: category.slug, name: category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function localHome() {
  const { categories, products } = catalogue;
  const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const active = products.filter((product) => product.isActive);
  const featured = active.filter((product) => product.isFeatured).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8).map(toCard);
  const arrivals = active.filter((product) => Date.parse(product.createdAt) >= since).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8).map(toCard);
  const priced = active.filter((product) => product.price <= 999).sort((a, b) => a.price - b.price).map(toCard);
  const deals = active
    .filter((product) => product.compareAtPrice != null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toCard)
    .filter((card) => card.compareAtPrice != null && card.compareAtPrice > card.price && !card.fromPrice)
    .slice(0, 8);
  const best = queryRows(products, categories, new Map(), { bestSellersOnly: true, page: 1 });
  return {
    categories: categoryLinks(categories, products, "top"),
    featured,
    arrivals,
    trending: [] as ReturnType<typeof toCard>[],
    deals,
    bestSellers: best.items.slice(0, 8),
    budget: {
      under199: priced.filter((product) => product.price <= 199).slice(0, 4),
      from200to499: priced.filter((product) => product.price >= 200 && product.price <= 499).slice(0, 4),
      from500to999: priced.filter((product) => product.price >= 500 && product.price <= 999).slice(0, 4),
    },
    announcement: {
      title: "Shipping at checkout",
      message: "Shipping is ₹49, and free when the payable product total reaches ₹999.",
      href: "/shipping-policy",
    },
    coupons: [{ id: "cpn_welcome50", code: "WELCOME50", type: "FIXED", value: 50, minSubtotal: 499 }],
    productCount: active.length,
  };
}

function sectionMembers(kind: "trending" | "searched", scores: Map<string, EngagementScore>) {
  const products = catalogue.products;
  if (kind === "trending") {
    return rankTrending(products, scores, products.length, false);
  }
  const clicked = rankMostSearched(products, scores, 1);
  if (clicked.ranked) return rankMostSearched(products, scores, products.length);
  return rankMostSearched(products, scores, 5);
}

export function localSectionQuery(
  kind: "trending" | "searched",
  input: CatalogInput,
  scores: Map<string, EngagementScore>,
  sales: Map<string, number> = new Map(),
  ratings: Map<string, number> = new Map(),
) {
  const members = sectionMembers(kind, scores);
  const order = new Map(members.items.map((product, index) => [product.slug, index]));
  const filtered = queryRows(catalogue.products, catalogue.categories, sales, { ...input, page: 1, take: catalogue.products.length || 1 }, ratings);
  const matched = filtered.items.filter((item) => order.has(item.slug));
  const items = input.sort ? matched : matched.sort((a, b) => (order.get(a.slug) || 0) - (order.get(b.slug) || 0));
  const page = Math.max(1, input.page || 1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (items.length > 0 && page > pageCount) {
    return { items: [], total: items.length, page, pageCount, outOfRange: true as const };
  }
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: items.length,
    page,
    pageCount,
    outOfRange: false as const,
  };
}

export function localTrending(scores: Map<string, EngagementScore>) {
  const ranked = sectionMembers("trending", scores);
  return { products: ranked.items.slice(0, 5).map(toCard), ranked: ranked.ranked };
}

export function localBestSellers(sold: Map<string, number> | null) {
  const ranked = rankBestSellers(catalogue.products, sold, catalogue.products.length);
  if (!ranked.ranked) return { products: [] as ReturnType<typeof toCard>[], ranked: false };
  return { products: ranked.items.slice(0, 5).map(toCard), ranked: true };
}

export function localMostSearched(scores: Map<string, EngagementScore>) {
  const ranked = sectionMembers("searched", scores);
  return { products: ranked.items.slice(0, 5).map(toCard), ranked: ranked.ranked };
}

export function localQuery(input: CatalogInput, sales: Map<string, number> = new Map(), ratings: Map<string, number> = new Map()) {
  return queryRows(catalogue.products, catalogue.categories, sales, input, ratings);
}

export function localCategories(scope: "top" | "all" = "top") {
  return categoryLinks(catalogue.categories, catalogue.products, scope);
}

export function localCategory(slug: string) {
  return categoryDetail(slug, catalogue.categories, catalogue.products);
}

export function localProduct(slug: string) {
  return catalogue.products.find((product) => product.slug === slug && product.isActive) ?? null;
}

export function localRelated(categoryId: string, productId: string) {
  return relatedCards(categoryId, productId, catalogue.categories, catalogue.products);
}

export function localTogether(productId: string) {
  return togetherCards(productId, [], catalogue.products);
}

export function localWholesale(take = 24) {
  return catalogue.products
    .filter((product) => product.isActive && product.wholesaleEligible)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, take)
    .map(toCard);
}

export function localByIds(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, 50);
  return unique.flatMap((productId) => {
    const product = catalogue.products.find((item) => item.id === productId && item.isActive);
    return product ? [toCard(product)] : [];
  });
}

export function localBySlugs(slugs: string[]) {
  const unique = [...new Set(slugs)].slice(0, 12);
  return unique.flatMap((slug) => {
    const product = catalogue.products.find((item) => item.slug === slug && item.isActive);
    return product ? [toCard(product)] : [];
  });
}

export function localSitemap() {
  const active = catalogue.products.filter((product) => product.isActive);
  return {
    products: active.map((product) => ({ slug: product.slug, updatedAt: product.updatedAt })),
    categories: categoryLinks(catalogue.categories, catalogue.products, "all").map((category) => ({ slug: category.slug })),
  };
}

export function localQuote(items: Array<{ productId: string; variantId?: string | null; qty: number }>) {
  return items.map((item) => {
    const product = catalogue.products.find((entry) => entry.id === item.productId && entry.isActive);
    const key = `${item.productId}:${item.variantId || ""}`;
    if (!product) {
      return {
        key, productId: item.productId, variantId: item.variantId || null, slug: "", name: "Unavailable product", variantName: null,
        unitPrice: 0, image: "", sku: "", qty: item.qty, maxQty: 0, available: false, message: "This product is no longer available.",
      };
    }
    const image = product.images[0]?.url || "";
    if (product.variants.length > 0) {
      const variant = product.variants.find((entry) => entry.id === item.variantId);
      if (!variant) {
        return {
          key, productId: product.id, variantId: item.variantId || null, slug: product.slug, name: product.name, variantName: null,
          unitPrice: product.price, image, sku: product.sku, qty: item.qty, maxQty: 0, available: false,
          message: "Choose an option again on the product page.",
        };
      }
      const qty = Math.min(item.qty, variant.stock, MAX_LINE_QTY);
      return {
        key, productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, variantName: variant.name,
        unitPrice: sellingPrice(product.price, variant.price), image: variant.image || image, sku: variant.sku, qty,
        maxQty: Math.min(variant.stock, MAX_LINE_QTY), available: qty > 0,
        message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
      };
    }
    const qty = Math.min(item.qty, product.stock, MAX_LINE_QTY);
    return {
      key, productId: product.id, variantId: null, slug: product.slug, name: product.name, variantName: null,
      unitPrice: product.price, image, sku: product.sku, qty, maxQty: Math.min(product.stock, MAX_LINE_QTY), available: qty > 0,
      message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
    };
  });
}
