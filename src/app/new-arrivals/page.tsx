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
      intro={
        <>
          <p>Products added to the catalogue in the last {NEW_ARRIVAL_DAYS} days. The selling price is the one stored for each item, and stock follows the recorded quantity.</p>
          <p>Older products stay in All products. This list only changes when new catalogue items are added inside that window.</p>
        </>
      }
      basePath="/new-arrivals"
      searchParams={searchParams}
      preset={{ arrivalsOnly: true, sort: "newest" }}
    />
  );
}
