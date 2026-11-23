import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Trending products",
  description: "BazaarDost products shoppers open most often, ordered by recorded page views and clicks.",
  alternates: { canonical: "/trending" },
};

export default function TrendingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Trending products"
      intro="Products shoppers open most often. The order follows recorded page views, clicks, and orders. It is not a hand-picked list."
      basePath="/trending"
      searchParams={searchParams}
      preset={{ trendingOnly: true }}
    />
  );
}
