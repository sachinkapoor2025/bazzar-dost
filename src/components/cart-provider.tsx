"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

type AddInput = Omit<CartLine, "key" | "qty"> & { qty?: number };
type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (line: AddInput) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  buyNow: (line: AddInput) => void;
  notice: string;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "bazaardost.cart.v1";

function storageKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId || ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as CartLine[];
      if (Array.isArray(parsed)) setLines(parsed.filter((line) => line && line.productId && line.qty > 0));
    } catch {
      setLines([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      ready,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      notice,
      drawerOpen,
      setDrawerOpen,
      add(line) {
        const key = storageKey(line.productId, line.variantId);
        const qty = Math.max(1, line.qty || 1);
        setLines((current) => {
          const existing = current.find((item) => item.key === key);
          if (!existing) {
            return [...current, { ...line, key, qty: Math.min(qty, line.maxQty) }];
          }
          return current.map((item) =>
            item.key === key ? { ...item, ...line, key, qty: Math.min(item.qty + qty, line.maxQty) } : item,
          );
        });
        setNotice(`${line.name} added to cart.`);
        setDrawerOpen(true);
      },
      setQty(key, qty) {
        setLines((current) =>
          current.flatMap((item) => {
            if (item.key !== key) return [item];
            if (qty <= 0) return [];
            return [{ ...item, qty: Math.min(qty, item.maxQty) }];
          }),
        );
      },
      remove(key) {
        setLines((current) => current.filter((item) => item.key !== key));
      },
      clear() {
        setLines([]);
      },
      buyNow(line) {
        const key = storageKey(line.productId, line.variantId);
        const next = { ...line, key, qty: Math.min(Math.max(1, line.qty || 1), line.maxQty) };
        sessionStorage.setItem("bazaardost.buynow", JSON.stringify([next]));
        window.location.href = "/checkout?mode=now";
      },
    };
  }, [lines, notice, ready, drawerOpen]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice ? (
        <p role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-forest-800 px-4 py-2 text-sm text-cream-50 md:bottom-6">
          {notice}
        </p>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
