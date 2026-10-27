import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist-view";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default function WishlistPage() {
  return (
    <Container className="py-6">
      <h1 className="mb-4 font-display text-4xl">Wishlist</h1>
      <WishlistView />
    </Container>
  );
}
