import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container className="py-6">
      <h1 className="mb-4 font-display text-4xl text-forest-900">Cart</h1>
      <CartView />
    </Container>
  );
}
