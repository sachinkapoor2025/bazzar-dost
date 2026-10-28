"use client";

import { CartProvider } from "@/components/cart-provider";
import { CompareProvider } from "@/components/compare-provider";
import { WishlistProvider } from "@/components/wishlist-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CompareProvider>{children}</CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
