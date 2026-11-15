import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Best sellers",
  description: "BazaarDost best sellers ranked by units customers have actually ordered. Cancelled orders are not included.",
  alternates: { canonical: "/best-sellers" },
};

export default function BestSellersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Best sellers"
      intro={
        <>
          <p>Products appear here after a customer places an order. The list uses units sold and leaves out cancelled orders. It stays empty until the first sale.</p>
          <p>Opening a product does not move it onto this list. Ranking follows completed orders only, using the quantities stored on those orders.</p>
        </>
      }
      basePath="/best-sellers"
      searchParams={searchParams}
      preset={{ bestSellersOnly: true, sort: "popular" }}
    />
  );
}
