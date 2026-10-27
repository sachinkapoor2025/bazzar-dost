import Link from "next/link";
import { Container, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-700">404</p>
      <h1 className="mt-2 font-display text-4xl text-forest-900">That page is not in the catalogue</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">The link may be old, or the product may be inactive. Try search, or go back to the shop.</p>
      <form action="/search" method="get" role="search" className="mt-5 flex max-w-md">
        <label htmlFor="not-found-q" className="sr-only">Search products</label>
        <input id="not-found-q" name="q" className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 px-4" />
        <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
      </form>
      <div className="mt-4 flex gap-3">
        <Link href="/" className={buttonClass("primary")}>Home</Link>
        <Link href="/shop" className={buttonClass("outline")}>Shop all</Link>
      </div>
    </Container>
  );
}
