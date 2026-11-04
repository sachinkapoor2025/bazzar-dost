import assert from "node:assert/strict";
import test from "node:test";
import { popularAvailable, rankBestSellers, type TrendCandidate } from "../src/lib/trending";

function product(slug: string, overrides: Partial<TrendCandidate> = {}): TrendCandidate {
  return {
    slug,
    name: overrides.name || slug,
    isActive: overrides.isActive ?? true,
    isFeatured: false,
    stock: overrides.stock ?? 5,
    categoryId: overrides.categoryId || "general",
    variants: overrides.variants || [],
  };
}

test("ranks best sellers by units sold and ignores products with no sales", () => {
  const products = [
    product("lamp", { stock: 2, categoryId: "home" }),
    product("cable", { stock: 20, categoryId: "electronics" }),
    product("pen", { stock: 1, categoryId: "office" }),
    product("hidden", { stock: 9, isActive: false }),
  ];
  const sold = new Map([
    ["pen", 6],
    ["lamp", 2],
    ["hidden", 20],
  ]);
  const ranked = rankBestSellers(products, sold, 3);
  assert.equal(ranked.ranked, true);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["pen", "lamp"],
  );
});

test("breaks equal sales by product name", () => {
  const products = [product("zeta"), product("alpha")];
  const ranked = rankBestSellers(products, new Map([["zeta", 3], ["alpha", 3]]), 2);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["alpha", "zeta"],
  );
});

test("uses later popular products when sales data is unavailable", () => {
  const products = [
    product("apple", { categoryId: "kitchen", name: "Apple" }),
    product("mango", { categoryId: "kitchen", name: "Mango" }),
    product("brush", { categoryId: "beauty", name: "Brush" }),
    product("comb", { categoryId: "beauty", name: "Comb" }),
    product("kite", { categoryId: "toys", name: "Kite" }),
    product("yo", { categoryId: "toys", name: "Yo" }),
  ];
  const ranked = rankBestSellers(products, null, 3);
  assert.equal(ranked.ranked, false);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["mango", "comb", "yo"],
  );
  assert.deepEqual(
    popularAvailable(products, 3).map((item) => item.slug),
    ["apple", "brush", "kite"],
  );
});

test("treats an empty sales result the same as unavailable data", () => {
  const products = [product("jar", { categoryId: "kitchen", name: "Jar", stock: 4 })];
  const ranked = rankBestSellers(products, new Map(), 4);
  assert.equal(ranked.ranked, false);
  assert.deepEqual(
    ranked.items.map((item) => item.slug),
    ["jar"],
  );
});
