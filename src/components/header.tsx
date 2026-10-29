"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useCompare } from "@/components/compare-provider";
import { Logo } from "@/components/logo";
import { StoreControls } from "@/components/store-controls";
import { useWishlist } from "@/components/wishlist-provider";
import { Container } from "@/components/ui";
import type { CategoryLink } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "All products" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/best-sellers", label: "Best Sellers" },
  { href: "/deals", label: "Deals & Offers" },
  { href: "/wholesale", label: "Wholesale" },
];

export function Header({ categories }: { categories: CategoryLink[] }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const searchId = useId();
  const mobileSearchId = useId();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
      <div className="border-b border-cream-200 bg-cream-100">
        <Container className="flex h-11 items-center justify-end">
          <StoreControls />
        </Container>
      </div>
      <Container className="flex h-16 items-center gap-3">
        <Logo />
        <form action="/search" method="get" role="search" className="hidden min-w-0 flex-1 md:flex">
          <label htmlFor={searchId} className="sr-only">Search products</label>
          <input id={searchId} name="q" placeholder="Search products" className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 bg-white px-4 text-sm" />
          <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
        </form>
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
          <Link href="/cart" className="relative inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-cream-200">
            Cart
            <Count value={cart.count} />
          </Link>
          <button type="button" className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold md:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
        </nav>
      </Container>
      {searchOpen ? (
        <Container className="pb-3 md:hidden">
          <form action="/search" method="get" role="search" className="flex">
            <label htmlFor={mobileSearchId} className="sr-only">Search products</label>
            <input id={mobileSearchId} name="q" placeholder="Search products" className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 bg-white px-4 text-sm" />
            <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
          </form>
        </Container>
      ) : null}
      <nav aria-label="Main" className="hidden border-t border-cream-200 md:block">
        <Container className="flex h-12 items-center gap-5 text-sm font-semibold">
          {links.slice(0, 2).map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-forest-700">{link.label}</Link>
          ))}
          <div className="group relative">
            <Link href="/categories" className="inline-flex min-h-11 items-center hover:text-forest-700" aria-haspopup="true">Categories</Link>
            <div className="invisible absolute left-0 top-full z-20 max-h-96 w-72 overflow-y-auto rounded-2xl border border-cream-300 bg-white p-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {categories.map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`} className="block rounded-xl px-3 py-2 hover:bg-cream-100">
                  {category.name}
                </Link>
              ))}
              <Link href="/categories" className="block rounded-xl px-3 py-2 font-semibold text-forest-800 hover:bg-cream-100">All categories</Link>
            </div>
          </div>
          {links.slice(2).map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-forest-700">{link.label}</Link>
          ))}
        </Container>
      </nav>
      {open ? (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-cream-200 bg-cream-50 md:hidden">
          <Container className="grid gap-1 py-3">
            <Link href="/" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/shop" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>All products</Link>
            <Link href="/categories" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>Categories</Link>
            {categories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-xl px-3 py-2 pl-6 text-sm hover:bg-cream-200" onClick={() => setOpen(false)}>
                {category.name}
              </Link>
            ))}
            {links.slice(2).map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>{link.label}</Link>
            ))}
            <Link href="/compare" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>Compare{compare.ids.length ? ` (${compare.ids.length})` : ""}</Link>
            <Link href="/account" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>My Account</Link>
            <Link href="/track" className="rounded-xl px-3 py-3 hover:bg-cream-200" onClick={() => setOpen(false)}>Order Tracking</Link>
          </Container>
        </nav>
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
      <Link href="/cart" className={item}>Cart{cart.count ? ` ${cart.count}` : ""}</Link>
    </nav>
  );
}
