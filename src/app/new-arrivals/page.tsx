import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { NEW_ARRIVAL_DAYS } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "New arrivals",
  description: `Products added to the BazaarDost catalogue in the last ${NEW_ARRIVAL_DAYS} days.`,
  alternates: { canonical: "/new-arrivals" },
};

export default function NewArrivalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <CatalogBrowser
      title="New arrivals"
      intro={`Products added in the last ${NEW_ARRIVAL_DAYS} days.`}
      basePath="/new-arrivals"
      searchParams={searchParams}
      preset={{ arrivalsOnly: true, sort: "newest" }}
    />
  );
}
