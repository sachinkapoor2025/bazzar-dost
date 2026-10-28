import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Deals and offers",
  description: "BazaarDost deals where the selling price is lower than the compare-at price from the product list, plus any active coupon.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Deals and offers"
      intro="These products have a compare-at price higher than the selling price in the catalogue. The discount is calculated from those two amounts. There is no extra markdown."
      basePath="/deals"
      searchParams={searchParams}
      preset={{ dealsOnly: true }}
    />
  );
}
