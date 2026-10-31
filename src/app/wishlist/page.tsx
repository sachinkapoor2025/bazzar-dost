import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist-view";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you saved from the BazaarDost catalogue. Saving an item does not reserve it.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl">Wishlist</h1>
      <p className="mb-4 mt-2 max-w-2xl text-sm leading-6 text-muted">Products you want to come back to. A saved item can still go out of stock, because the wishlist does not hold quantity.</p>
      <WishlistView />
    </Container>
  );
}
