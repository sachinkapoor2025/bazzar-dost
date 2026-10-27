import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse the BazaarDost catalogue, filter by category and price, and sort by newest, price, or orders.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Shop all"
      intro="Every active product in the catalogue. Filters apply together."
      basePath="/shop"
      searchParams={searchParams}
    />
  );
}
