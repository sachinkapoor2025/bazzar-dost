import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Search",
  description: "Search BazaarDost products by name, from kitchen tools and beauty items to phone accessories, toys, and bags.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const value = raw.q;
  const q = (Array.isArray(value) ? value[0] : value)?.trim() || "";
  if (!q) {
    return (
      <Container className="py-8">
        <h1 className="font-display text-4xl">Search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Search the catalogue by product name, SKU, or a word from the description. Results stay inside the departments that currently have products.</p>
        <form action="/search" method="get" role="search" className="mt-4 flex max-w-xl">
          <label htmlFor="search-page-q" className="sr-only">Search products</label>
          <input id="search-page-q" name="q" className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 px-4" />
          <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
        </form>
      </Container>
    );
  }
  return (
    <CatalogBrowser
      title={`Search results for “${q.slice(0, 80)}”`}
      intro="Matches come from product names and descriptions in the current catalogue. You can still filter by department, price, and stock."
      basePath="/search"
      searchParams={searchParams}
    />
  );
}
