import Link from "next/link";
import type { CatalogInput } from "@/lib/catalog";

export function pageHref(basePath: string, query: CatalogInput, page: number, lockCategory = false) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (!lockCategory && query.category) params.set("category", query.category);
  if (query.min != null) params.set("min", String(query.min));
  if (query.max != null) params.set("max", String(query.max));
  if (query.sort && query.sort !== "newest" && !(query.bestSellersOnly && query.sort === "popular")) params.set("sort", query.sort);
  if (query.inStockOnly) params.set("stock", "in");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  query,
  page,
  pageCount,
  lockCategory = false,
}: {
  basePath: string;
  query: CatalogInput;
  page: number;
  pageCount: number;
  lockCategory?: boolean;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => Math.abs(number - page) <= 2 || number === 1 || number === pageCount);
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center gap-2">
      {page > 1 ? <Link className="rounded-full border border-cream-300 px-3 py-2 text-sm" href={pageHref(basePath, query, page - 1, lockCategory)}>Previous</Link> : null}
      {pages.map((number) => (
        <Link
          key={number}
          href={pageHref(basePath, query, number, lockCategory)}
          aria-current={number === page ? "page" : undefined}
          className={`grid h-10 w-10 place-items-center rounded-full text-sm ${number === page ? "bg-forest-800 text-cream-50" : "border border-cream-300"}`}
        >
          {number}
        </Link>
      ))}
      {page < pageCount ? <Link className="rounded-full border border-cream-300 px-3 py-2 text-sm" href={pageHref(basePath, query, page + 1, lockCategory)}>Next</Link> : null}
    </nav>
  );
}
