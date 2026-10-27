import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Best sellers",
  description: "BazaarDost products ranked by quantities actually ordered. Cancelled orders are excluded.",
  alternates: { canonical: "/best-sellers" },
};

export default function BestSellersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Best sellers"
      intro="Only products that have been ordered appear here. The default order is units sold, excluding cancelled orders."
      basePath="/best-sellers"
      searchParams={searchParams}
      preset={{ bestSellersOnly: true, sort: "popular" }}
    />
  );
}
