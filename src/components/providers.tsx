"use client";

import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { CompareProvider } from "@/components/compare-provider";
import { PreferencesProvider } from "@/components/preferences-provider";
import { WishlistProvider } from "@/components/wishlist-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            {children}
            <CartDrawer />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </PreferencesProvider>
  );
}
