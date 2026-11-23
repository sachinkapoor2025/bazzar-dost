import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Featured products",
  description: "Products marked as featured in the BazaarDost catalogue.",
  alternates: { canonical: "/featured" },
};

export default function FeaturedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Featured products"
      intro="These are the products marked as featured in the catalogue. The selling price and stock are the values stored for each item."
      basePath="/featured"
      searchParams={searchParams}
      preset={{ featuredOnly: true, sort: "newest" }}
    />
  );
}
