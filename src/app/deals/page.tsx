import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";

export const metadata: Metadata = {
  title: "Deals and offers",
  description: "Products whose selling price is below the compare-at price stored in the catalogue, plus active coupons.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="Deals and offers"
      intro="A product is listed here only when its compare-at price is higher than the selling price. Variant products with more than one price are left out, so a badge is not shown for a size that is not discounted."
      basePath="/deals"
      searchParams={searchParams}
      preset={{ dealsOnly: true }}
    />
  );
}
