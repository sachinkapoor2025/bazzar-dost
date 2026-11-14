import assert from "node:assert/strict";
import test from "node:test";
import { emptyScore, popularAvailable, rankMostSearched, rankTrending, type EngagementScore, type TrendCandidate } from "../src/lib/trending";

function product(slug: string, overrides: Partial<TrendCandidate> = {}): TrendCandidate {
  return {
    slug,
    name: overrides.name || slug,
    isActive: overrides.isActive ?? true,
    isFeatured: overrides.isFeatured ?? false,
    stock: overrides.stock ?? 0,
    categoryId: overrides.categoryId || "general",
    variants: overrides.variants || [],
  };
}

function scores(entries: Array<[string, Partial<EngagementScore>]>): Map<string, EngagementScore> {
  return new Map(entries.map(([slug, score]) => [slug, { ...emptyScore(), ...score }]));
}

test("ranks products by views, clicks, orders, and wishlists", () => {
  const products = [
    product("lamp", { stock: 4, categoryId: "home" }),
    product("cable", { stock: 40, categoryId: "electronics" }),
    product("pen", { stock: 1, categoryId: "office" }),
  ];
  const ranked = rankTrending(
    products,
    scores([
      ["lamp", { views: 2, clicks: 1 }],
      ["pen", { views: 1, clicks: 4, orders: 1, wishlists: 2 }],
      ["cable", { clicks: 3 }],
    ]),
    3,
  );
  assert.equal(ranked.ranked, true);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["pen", "lamp", "cable"],
  );
});

test("breaks equal engagement by views, then clicks, then name", () => {
  const products = [product("zeta"), product("alpha"), product("mid")];
  const ranked = rankTrending(
    products,
    scores([
      ["zeta", { clicks: 4 }],
      ["alpha", { clicks: 4 }],
      ["mid", { views: 1, clicks: 3 }],
    ]),
    3,
  );
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["mid", "alpha", "zeta"],
  );
});

test("keeps a viewed out-of-stock product and fills the rest with available products", () => {
  const products = [
    product("sold-out", { stock: 0, categoryId: "home" }),
    product("apple", { stock: 2, categoryId: "kitchen", name: "Apple" }),
    product("mango", { stock: 2, categoryId: "kitchen", name: "Mango" }),
    product("brush", { stock: 2, categoryId: "beauty", name: "Brush" }),
  ];
  const ranked = rankTrending(products, scores([["sold-out", { views: 6 }]]), 3);
  assert.equal(ranked.ranked, true);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["sold-out", "apple", "brush"],
  );
});

test("uses popular in-stock products when tracking data is empty", () => {
  const products = [
    product("gone", { stock: 0, categoryId: "kitchen", name: "Gone" }),
    product("hidden", { stock: 9, isActive: false, categoryId: "kitchen", name: "Hidden" }),
    product("apple", { stock: 2, categoryId: "kitchen", name: "Apple" }),
    product("mango", { stock: 8, categoryId: "kitchen", name: "Mango" }),
    product("brush", { stock: 1, categoryId: "beauty", name: "Brush" }),
    product("kite", { stock: 3, categoryId: "toys", name: "Kite" }),
    product("towel", { stock: 0, categoryId: "kitchen", name: "Towel", variants: [{ stock: 4 }] }),
  ];
  const ranked = rankTrending(products, new Map(), 4);
  assert.equal(ranked.ranked, false);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["apple", "brush", "kite", "mango"],
  );
  assert.deepEqual(
    popularAvailable(products, 4).map((item) => item.slug),
    ranked.items.map((item) => item.slug),
  );
});

test("ranks most searched products by clicks", () => {
  const products = [
    product("lamp", { stock: 4, categoryId: "home", name: "Lamp" }),
    product("cable", { stock: 4, categoryId: "electronics", name: "Cable" }),
    product("pen", { stock: 4, categoryId: "office", name: "Pen" }),
  ];
  const ranked = rankMostSearched(
    products,
    scores([
      ["lamp", { views: 20, clicks: 1 }],
      ["pen", { clicks: 6 }],
      ["cable", { clicks: 3 }],
    ]),
    2,
  );
  assert.equal(ranked.ranked, true);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["pen", "cable"],
  );
});

test("treats an all-zero score the same as missing tracking", () => {
  const products = [product("jar", { stock: 3, categoryId: "kitchen", name: "Jar" })];
  const ranked = rankTrending(products, scores([["jar", { views: 0, clicks: 0, orders: 0, wishlists: 0 }]]), 4);
  assert.equal(ranked.ranked, false);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["jar"],
  );
});
