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
      <p className="mb-4 mt-2 max-w-3xl text-base leading-7 text-muted">Products you want to come back to. A saved item can still go out of stock, because the wishlist does not hold quantity. Signing in keeps the list with your account. Until then it stays in this browser.</p>
      <WishlistView />
    </Container>
  );
}
