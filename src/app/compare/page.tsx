import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Compare products",
  description: "Compare up to three BazaarDost products using the prices and details stored in the catalogue.",
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl text-forest-900">Compare products</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Compare up to 3 products from the catalogue using the stored price, stock, and description. There is no rating column because customers have not left reviews.</p>
      <div className="mt-5">
        <CompareView />
      </div>
    </Container>
  );
}
