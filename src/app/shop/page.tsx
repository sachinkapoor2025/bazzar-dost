import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "All products",
  description: "Browse every product in the BazaarDost catalogue, filter by category and price, and sort by newest, price, or orders.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="All products"
      intro="Every active product in the catalogue. Search, category, price, and availability filters apply together."
      basePath="/shop"
      searchParams={searchParams}
    />
  );
}
