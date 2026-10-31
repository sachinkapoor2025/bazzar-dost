"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PublicUser } from "@/lib/types";

type WishlistContextValue = {
  ids: string[];
  user: PublicUser | null;
  ready: boolean;
  toggle: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const KEY = "bazaardost.wishlist.v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let local: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      if (Array.isArray(parsed)) local = parsed.filter((id) => typeof id === "string");
    } catch {
      local = [];
    }
    setIds(local);
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then(async (data: { user: PublicUser | null }) => {
        setUser(data.user);
        if (!data.user) return;
        const synced = await fetch("/api/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: local }),
        }).then((response) => response.json());
        if (Array.isArray(synced.productIds)) setIds(synced.productIds);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      user,
      ready,
      toggle(productId: string) {
        setIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
        if (user) {
          fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          }).catch(() => undefined);
        }
      },
    }),
    [ids, ready, user],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
