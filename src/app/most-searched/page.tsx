import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Most searched products",
  description: "BazaarDost products opened from search, ordered by recorded clicks.",
  alternates: { canonical: "/most-searched" },
};

export default function MostSearchedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Most searched products"
      intro="Products opened from search results and product cards. The list follows recorded clicks."
      basePath="/most-searched"
      searchParams={searchParams}
      preset={{ searchedOnly: true }}
    />
  );
}
