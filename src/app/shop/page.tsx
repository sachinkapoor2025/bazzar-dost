import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "All products",
  description: "Browse every BazaarDost product, from home and kitchen to beauty, electronics accessories, toys, and travel. Filter by department, price, and stock.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="All products"
      intro={
        <>
          <p>Every product currently in the BazaarDost catalogue is listed here, from kitchen tools and personal care to phone accessories, toys, bags, and outdoor items.</p>
          <p>Search by name, then narrow by department, price, or availability. A product is marked out of stock only when its recorded quantity is zero. A lower price is shown only when that product has a higher compare-at price.</p>
        </>
      }
      basePath="/shop"
      searchParams={searchParams}
    />
  );
}
