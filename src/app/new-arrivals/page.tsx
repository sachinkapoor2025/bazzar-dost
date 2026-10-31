import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { NEW_ARRIVAL_DAYS } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "New arrivals",
  description: `New BazaarDost products added in the last ${NEW_ARRIVAL_DAYS} days, including home, beauty, accessories, toys, and other stocked departments.`,
  alternates: { canonical: "/new-arrivals" },
};

export default function NewArrivalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="New arrivals"
      intro={`Products added to the catalogue in the last ${NEW_ARRIVAL_DAYS} days. Prices are the selling prices stored for each item.`}
      basePath="/new-arrivals"
      searchParams={searchParams}
      preset={{ arrivalsOnly: true, sort: "newest" }}
    />
  );
}
