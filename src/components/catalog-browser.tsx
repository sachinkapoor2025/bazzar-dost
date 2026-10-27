import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, queryCatalog, readCatalogQuery, type CatalogInput } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Container, fieldClass, labelClass } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/commerce";

export async function CatalogBrowser({
  title,
  intro,
  basePath,
  searchParams,
  preset,
  lockCategory = false,
}: {
  title: string;
  intro?: string;
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  preset?: Partial<CatalogInput>;
  lockCategory?: boolean;
}) {
  const query = readCatalogQuery(await searchParams, preset);
  const [result, categories] = await Promise.all([queryCatalog(query), getCategories()]);
  if (result.outOfRange) notFound();
  const start = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(result.total, result.page * PAGE_SIZE);

  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl text-forest-900">{title}</h1>
      {intro ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{intro}</p> : null}
      <form action={basePath} method="get" className="mt-5 grid gap-3 rounded-2xl border border-cream-300 bg-white p-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="filter-q">Search</label>
          <input id="filter-q" name="q" defaultValue={query.q || ""} className={fieldClass} />
        </div>
        {lockCategory ? null : (
          <div>
            <label className={labelClass} htmlFor="filter-category">Category</label>
            <select id="filter-category" name="category" defaultValue={query.category || ""} className={fieldClass}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor="filter-min">Min price</label>
          <input id="filter-min" name="min" inputMode="numeric" defaultValue={query.min ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-max">Max price</label>
          <input id="filter-max" name="max" inputMode="numeric" defaultValue={query.max ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="filter-sort">Sort</label>
          <select id="filter-sort" name="sort" defaultValue={query.sort || (preset?.bestSellersOnly ? "popular" : "newest")} className={fieldClass}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="popular">Most ordered</option>
          </select>
        </div>
        <div className="flex items-end gap-3 md:col-span-6">
          <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Apply filters</button>
          <Link href={basePath} className="text-sm font-semibold text-forest-800 underline">Clear all filters</Link>
        </div>
      </form>
      {result.priceError ? <p role="alert" className="mt-4 text-sm text-[#7F1D1D]">{result.priceError}</p> : null}
      <p className="mt-4 text-sm text-muted">{result.total === 0 ? "0 products" : `Showing ${start}–${end} of ${result.total}`}</p>
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
      <Pagination basePath={basePath} query={query} page={result.page} pageCount={result.pageCount} lockCategory={lockCategory} />
    </Container>
  );
}
