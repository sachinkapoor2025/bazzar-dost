import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the BazaarDost catalogue by product name.",
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
        <p className="mt-2 text-sm text-muted">Enter a product name, SKU, or a word from the short description.</p>
        <form action="/search" method="get" role="search" className="mt-4 flex max-w-xl">
          <label htmlFor="search-page-q" className="sr-only">Search products</label>
          <input id="search-page-q" name="q" className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 px-4" />
          <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
        </form>
      </Container>
    );
  }
  return <CatalogBrowser title={`Search results for “${q.slice(0, 80)}”`} basePath="/search" searchParams={searchParams} />;
}
