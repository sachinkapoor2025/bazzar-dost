"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product-card";
import { pageHref, Pagination } from "@/components/pagination";
import { fieldClass, labelClass } from "@/components/ui";
import { PAGE_SIZE, parseRating, parseRupee } from "@/lib/commerce";
import type { CatalogInput, CatalogResult } from "@/lib/catalog";

type Filters = {
  q: string;
  category: string;
  min: string;
  max: string;
  stock: string;
  rating: string;
  sort: string;
};

function filtersFromQuery(query: CatalogInput, fallbackSort: string): Filters {
  return {
    q: query.q || "",
    category: query.category || "",
    min: query.min != null ? String(query.min) : "",
    max: query.max != null ? String(query.max) : "",
    stock: query.outOfStockOnly ? "out" : query.inStockOnly ? "in" : "",
    rating: query.minRating ? String(query.minRating) : "",
    sort: query.sort || fallbackSort,
  };
}

export function CatalogLive({
  basePath,
  lockCategory = false,
  categories,
  preset,
  initialQuery,
  initialResult,
}: {
  basePath: string;
  lockCategory?: boolean;
  categories: Array<{ slug: string; label: string }>;
  preset?: Partial<CatalogInput>;
  initialQuery: CatalogInput;
  initialResult: CatalogResult;
}) {
  const fallbackSort = preset?.bestSellersOnly ? "popular" : "newest";
  const [filters, setFilters] = useState(() => filtersFromQuery(initialQuery, fallbackSort));
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState(initialResult);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function load(nextFilters: Filters, page: number, fromHistory = false) {
    const min = parseRupee(nextFilters.min);
    const max = parseRupee(nextFilters.max);
    const next: CatalogInput = {
      q: nextFilters.q.trim() || undefined,
      category: lockCategory ? preset?.category || initialQuery.category : nextFilters.category || undefined,
      min,
      max,
      sort: nextFilters.sort || fallbackSort,
      page,
      inStockOnly: nextFilters.stock === "in" || preset?.inStockOnly,
      outOfStockOnly: nextFilters.stock === "out",
      minRating: parseRating(nextFilters.rating),
      dealsOnly: preset?.dealsOnly,
      wholesaleOnly: preset?.wholesaleOnly,
      arrivalsOnly: preset?.arrivalsOnly,
      bestSellersOnly: preset?.bestSellersOnly,
    };
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await response.json()) as CatalogResult & { error?: string };
      if (!response.ok) {
        setError(data.error || "The catalogue could not be updated.");
        return;
      }
      if (data.outOfRange) {
        setError("That page is outside the results.");
        return;
      }
      setQuery(next);
      setResult(data);
      if (!fromHistory) {
        const href = pageHref(basePath, next, data.page, lockCategory);
        window.history.pushState(null, "", href);
      }
    } catch {
      setError("The catalogue could not be updated.");
    } finally {
      setPending(false);
    }
  }

  function update(partial: Partial<Filters>, page = 1) {
    const next = { ...filters, ...partial };
    setFilters(next);
    void load(next, page);
  }

  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search);
      const next = filtersFromQuery(
        {
          q: params.get("q") || undefined,
          category: lockCategory ? preset?.category || initialQuery.category : params.get("category") || undefined,
          min: parseRupee(params.get("min") || undefined),
          max: parseRupee(params.get("max") || undefined),
          sort: params.get("sort") || fallbackSort,
          inStockOnly: params.get("stock") === "in",
          outOfStockOnly: params.get("stock") === "out",
          minRating: parseRating(params.get("rating") || undefined),
        },
        fallbackSort,
      );
      setFilters(next);
      void load(next, Number(params.get("page") || 1) || 1, true);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [basePath, fallbackSort, initialQuery.category, lockCategory, preset?.category]);

  function clearFilters() {
    const next = filtersFromQuery({ category: lockCategory ? preset?.category || initialQuery.category : undefined, sort: fallbackSort }, fallbackSort);
    setFilters(next);
    void load(next, 1);
  }

  const start = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(result.total, result.page * PAGE_SIZE);

  return (
    <>
      <form
        className="mt-5 grid gap-3 rounded-2xl border border-cream-300 bg-white p-3 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          void load(filters, 1);
        }}
      >
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="filter-q">Search</label>
          <input id="filter-q" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} className={fieldClass} />
        </div>
        {lockCategory ? null : (
          <div>
            <label className={labelClass} htmlFor="filter-category">Category</label>
            <select id="filter-category" value={filters.category} onChange={(event) => update({ category: event.target.value })} className={fieldClass}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor="filter-min">Min price</label>
          <input id="filter-min" inputMode="numeric" value={filters.min} onChange={(event) => setFilters({ ...filters, min: event.target.value })} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-max">Max price</label>
          <input id="filter-max" inputMode="numeric" value={filters.max} onChange={(event) => setFilters({ ...filters, max: event.target.value })} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-stock">Availability</label>
          <select id="filter-stock" value={filters.stock} onChange={(event) => update({ stock: event.target.value })} className={fieldClass}>
            <option value="">Any</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-rating">Rating</label>
          <select id="filter-rating" value={filters.rating} onChange={(event) => update({ rating: event.target.value })} className={fieldClass}>
            <option value="">Any</option>
            <option value="4">4 stars and up</option>
            <option value="3">3 stars and up</option>
            <option value="2">2 stars and up</option>
            <option value="1">1 star and up</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-sort">Sort</label>
          <select id="filter-sort" value={filters.sort} onChange={(event) => update({ sort: event.target.value })} className={fieldClass}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="popular">Most ordered</option>
          </select>
        </div>
        <div className="flex items-end gap-3 md:col-span-6">
          <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50 disabled:opacity-60" disabled={pending}>
            {pending ? "Updating…" : "Apply filters"}
          </button>
          <button type="button" className="text-sm font-semibold text-forest-800 underline" onClick={clearFilters}>Clear all filters</button>
        </div>
      </form>
      {result.priceError ? <p role="alert" className="mt-4 text-sm text-[#7F1D1D]">{result.priceError}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-[#7F1D1D]">{error}</p> : null}
      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {pending ? "Updating products…" : result.total === 0 ? "0 products" : `Showing ${start}–${end} of ${result.total}`}
      </p>
      <div aria-busy={pending}>
        {result.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-cream-300 bg-white p-8">
            <h2 className="font-display text-2xl">No products match</h2>
            <p className="mt-2 text-sm text-muted">Try another name, a wider price range, or clear the filters.</p>
            <Link href="/shop" className="mt-4 inline-flex min-h-11 items-center font-semibold text-forest-800 underline">Browse the full shop</Link>
          </div>
        ) : (
          <div className="mt-4">
            <ProductGrid products={result.items} />
          </div>
        )}
      </div>
      <Pagination basePath={basePath} query={query} page={result.page} pageCount={result.pageCount} lockCategory={lockCategory} onPage={(page) => void load(filters, page)} />
    </>
  );
}
