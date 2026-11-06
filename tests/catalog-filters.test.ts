import assert from "node:assert/strict";
import test from "node:test";
import { queryCatalog } from "../apps/api/src/lib/catalog-query";
import type { Category, HydratedProduct } from "../apps/api/src/lib/types";

const category: Category = {
  id: "cat_home",
  name: "Home",
  slug: "home",
  description: "",
  image: "",
  sortOrder: 0,
  parentId: null,
};

function product(overrides: Partial<HydratedProduct> & Pick<HydratedProduct, "id" | "slug" | "name" | "price" | "stock" | "createdAt">): HydratedProduct {
  return {
    sku: overrides.slug.toUpperCase(),
    description: "",
    shortDescription: "",
    compareAtPrice: null,
    categoryId: category.id,
    specifications: "[]",
    isActive: true,
    isFeatured: false,
    wholesaleEligible: false,
    minOrderQty: null,
    wholesalePrice: null,
    viewCount: 0,
    updatedAt: overrides.createdAt,
    images: [],
    variants: [],
    version: 1,
    category: { id: category.id, name: category.name, slug: category.slug, parent: null },
    ...overrides,
  };
}

const products = [
  product({ id: "prod_new", slug: "new", name: "New pan", price: 500, stock: 0, createdAt: "2026-03-01T00:00:00.000Z" }),
  product({ id: "prod_old", slug: "old", name: "Old pan", price: 100, stock: 4, createdAt: "2026-01-01T00:00:00.000Z" }),
];

test("sorts by price and filters availability from stored stock", () => {
  const low = queryCatalog(products, [category], new Map(), { sort: "price-asc" });
  assert.deepEqual(low.items.map((item) => item.slug), ["old", "new"]);
  const high = queryCatalog(products, [category], new Map(), { sort: "price-desc" });
  assert.deepEqual(high.items.map((item) => item.slug), ["new", "old"]);
  const available = queryCatalog(products, [category], new Map(), { inStockOnly: true });
  assert.deepEqual(available.items.map((item) => item.slug), ["new", "old"].filter((slug) => slug === "old"));
  const unavailable = queryCatalog(products, [category], new Map(), { outOfStockOnly: true });
  assert.deepEqual(unavailable.items.map((item) => item.slug), ["new"]);
});

test("filters by real review averages and ranks popularity by units sold", () => {
  const ratings = new Map([["old", 4.5]]);
  const rated = queryCatalog(products, [category], new Map(), { minRating: 4 }, ratings);
  assert.deepEqual(rated.items.map((item) => item.slug), ["old"]);
  const sales = new Map([["new", 8]]);
  const popular = queryCatalog(products, [category], sales, { sort: "popular" });
  assert.equal(popular.items[0]?.slug, "new");
});

test("keeps newest order when no sales are recorded", () => {
  const result = queryCatalog(products, [category], new Map(), { sort: "newest" });
  assert.equal(result.items[0]?.slug, "new");
});
