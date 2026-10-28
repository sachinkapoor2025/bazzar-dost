import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the BazaarDost products in your cart before cash-on-delivery checkout.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl text-forest-900">Cart</h1>
      <p className="mb-4 mt-2 max-w-2xl text-sm leading-6 text-muted">Items you can order now. Prices are checked again at checkout, and shipping is added from the cart total.</p>
      <CartView />
    </Container>
  );
}
