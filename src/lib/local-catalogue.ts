import "server-only";
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
import { categories as starterCategories, products as starterProducts } from "../../apps/api/src/starter-catalog";
import shopifyCatalogue from "@/data/shopify-catalogue.json";
import { MAX_LINE_QTY, sellingPrice } from "@/lib/commerce";

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
    if (bySlug.has(extra.slug)) continue;
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
  const starter = starterProducts.map((product) => {
    const category = bySlug.get(product.category);
    if (!category) throw new Error(`Starter product ${product.slug} has no category.`);
    const createdAt = new Date(builtAt - product.minutesAgo * 60 * 1000).toISOString();
    return {
      id: `prod_${product.slug}`,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      shortDescription: product.short,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.variants ? 0 : product.stock,
      categoryId: category.id,
      specifications: JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
      isActive: true,
      isFeatured: Boolean(product.featured),
      wholesaleEligible: Boolean(product.wholesale),
      minOrderQty: product.wholesale?.moq ?? null,
      wholesalePrice: product.wholesale?.price ?? null,
      viewCount: 0,
      createdAt,
      updatedAt: createdAt,
      images: [{ id: `img_${product.slug}`, url: `/media/products/${product.slug}.svg`, alt: product.name, sortOrder: 0 }],
      variants: (product.variants ?? []).map((variant) => ({
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
  const imported = shopifyCatalogue.products.map((product, index) => {
    const category = bySlug.get(product.categorySlug);
    if (!category) throw new Error(`Catalogue product ${product.slug} has no category.`);
    const createdAt = new Date(builtAt - index * 60 * 1000).toISOString();
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
      specifications: JSON.stringify(product.specifications.map(([label, value]) => ({ label, value }))),
      isActive: true,
      isFeatured: false,
      wholesaleEligible: false,
      minOrderQty: null,
      wholesalePrice: null,
      viewCount: 0,
      createdAt,
      updatedAt: createdAt,
      images: (product.images.length ? product.images : [{ url: "", alt: product.name }]).map((image, imageIndex) => ({
        id: `img_${product.slug}_${imageIndex}`,
        url: image.url,
        alt: image.alt || product.name,
        sortOrder: imageIndex,
      })),
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
  return { categories, products: [...starter, ...imported] };
}

const catalogue = buildCatalogue();

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

export function localQuery(input: CatalogInput) {
  return queryRows(catalogue.products, catalogue.categories, new Map(), input);
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
    categories: catalogue.categories.map((category) => ({ slug: category.slug })),
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
