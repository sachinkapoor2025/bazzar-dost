"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart-provider";
import { useCompare } from "@/components/compare-provider";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { StoreControls } from "@/components/store-controls";
import { useWishlist } from "@/components/wishlist-provider";
import { buttonClass, Container } from "@/components/ui";
import type { CategoryLink } from "@/lib/types";

const shoppingLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "All products" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/best-sellers", label: "Best Sellers" },
  { href: "/deals", label: "Deals & Offers" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/track", label: "Order Tracking" },
];

const budgetLinks = [
  { href: "/shop?max=199", label: "₹199 and under" },
  { href: "/shop?min=200&max=499", label: "₹200 to ₹499" },
  { href: "/shop?min=500&max=999", label: "₹500 to ₹999" },
  { href: "/shop?max=999", label: "Everything up to ₹999" },
];

export function Header({ categories }: { categories: CategoryLink[] }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const searchId = useId();
  const mobileSearchId = useId();
  const menuTitleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
      <Container className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 lg:min-h-[5.5rem] lg:flex-nowrap lg:py-0">
        <Logo />
        <SearchBox id={searchId} className="hidden min-w-0 flex-1 md:block" />
        <div className="order-last flex w-full min-w-0 items-center gap-1 border-t border-cream-200 pt-1 md:order-none md:w-auto md:border-0 md:pt-0">
          <StoreControls />
        </div>
        <nav aria-label="Account and cart" className="ml-auto flex items-center gap-1">
          <button type="button" className="min-h-11 rounded-full px-3 text-sm font-semibold md:hidden" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}>
            Search
          </button>
          <Link href="/account" className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200 sm:inline-flex">My Account</Link>
          <Link href="/compare" className="relative hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200 sm:inline-flex">
            Compare
            <Count value={compare.ids.length} />
          </Link>
          <Link href="/wishlist" className="relative inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200">
            Wishlist
            <Count value={wishlist.ids.length} />
          </Link>
          <button type="button" className="relative inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200" onClick={() => cart.setDrawerOpen(true)}>
            Cart
            <Count value={cart.count} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream-200"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
              <span className="block h-0.5 w-full rounded-full bg-forest-900" />
              <span className="block h-0.5 w-full rounded-full bg-forest-900" />
              <span className="block h-0.5 w-full rounded-full bg-forest-900" />
            </span>
          </button>
        </nav>
      </Container>
      {searchOpen ? (
        <Container className="pb-3 md:hidden">
          <SearchBox id={mobileSearchId} />
        </Container>
      ) : null}
      {open && mounted ? createPortal(
        <div className="fixed inset-0 z-50 flex justify-start bg-forest-950/40" role="presentation" onClick={closeMenu}>
          <aside
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby={menuTitleId}
            className="flex h-full w-[min(100vw-2.5rem,26rem)] flex-col bg-cream-50 text-ink shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-cream-300 px-4 py-3">
              <h2 id={menuTitleId} className="font-display text-3xl text-forest-900">Menu</h2>
              <button ref={closeRef} type="button" className={buttonClass("ghost")} onClick={closeMenu}>Close</button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
              <section>
                <h3 className="font-display text-2xl text-forest-900">What is in the catalogue</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  BazaarDost is organised around the products currently available. Each department has live items you can open, compare, and add to the cart. Prices stay as stored, and a lower price is shown only when that product has a higher compare-at price.
                </p>
                {categories.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Departments appear here when the catalogue has products.</p>
                ) : (
                  <ul className="mt-3 grid gap-3">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link href={`/categories/${category.slug}`} className="block rounded-2xl border border-cream-300 bg-white p-4 hover:border-forest-800" onClick={closeMenu}>
                          <span className="block font-display text-2xl text-forest-900">{category.name}</span>
                          <span className="mt-2 block text-sm leading-6 text-muted">{category.description || "Live items in this department."}</span>
                          <span className="mt-3 block text-sm font-semibold text-forest-800">{category.productCount} products</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Shop by budget</h3>
                <ul className="mt-2 grid gap-1">
                  {budgetLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block rounded-xl px-3 py-3 text-sm font-semibold text-forest-900 hover:bg-cream-200" onClick={closeMenu}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Shopping</h3>
                <ul className="mt-2 grid gap-1">
                  {shoppingLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block rounded-xl px-3 py-3 text-sm font-semibold text-forest-900 hover:bg-cream-200" onClick={closeMenu}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li className="sm:hidden">
                    <Link href="/compare" className="block rounded-xl px-3 py-3 text-sm font-semibold text-forest-900 hover:bg-cream-200" onClick={closeMenu}>
                      Compare{compare.ids.length ? ` (${compare.ids.length})` : ""}
                    </Link>
                  </li>
                  <li className="sm:hidden">
                    <Link href="/account" className="block rounded-xl px-3 py-3 text-sm font-semibold text-forest-900 hover:bg-cream-200" onClick={closeMenu}>
                      My Account
                    </Link>
                  </li>
                </ul>
              </section>
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
      {compare.notice ? <p role="status" className="bg-gold-400 px-4 py-1 text-center text-sm text-forest-950">{compare.notice}</p> : null}
      <div className="h-0.5 bg-gold-400" />
    </header>
  );
}

function Count({ value }: { value: number }) {
  if (!value) return null;
  return <span className="ml-1 rounded-full bg-gold-400 px-1.5 text-xs text-forest-900">{value}</span>;
}

export function MobileDock() {
  const cart = useCart();
  const wishlist = useWishlist();
  const item = "flex flex-col items-center justify-center text-[0.68rem] font-semibold";
  return (
    <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-cream-300 bg-cream-50 md:hidden">
      <Link href="/" className={item}>Home</Link>
      <Link href="/categories" className={item}>Categories</Link>
      <Link href="/account" className={item}>Account</Link>
      <Link href="/wishlist" className={item}>Wishlist{wishlist.ids.length ? ` ${wishlist.ids.length}` : ""}</Link>
      <button type="button" className={item} onClick={() => cart.setDrawerOpen(true)}>Cart{cart.count ? ` ${cart.count}` : ""}</button>
    </nav>
  );
}
