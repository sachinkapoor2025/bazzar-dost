"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Money } from "@/components/money";
import { unoptimizedImage } from "@/lib/format";

type Hit = { id: string; name: string; slug: string; price: number; image: string; categoryName: string; inStock: boolean };

export function SearchBox({ id, className = "" }: { id: string; className?: string }) {
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data: { products?: Hit[] }) => {
          setHits(data.products || []);
          setOpen(true);
        })
        .catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  return (
    <div className={`relative ${className}`}>
      <form action="/search" method="get" role="search" className="flex">
        <label htmlFor={id} className="sr-only">Search products</label>
        <input
          id={id}
          name="q"
          value={q}
          placeholder="Search products"
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={open && hits.length > 0}
          className="min-h-11 w-full rounded-l-full border border-r-0 border-cream-300 bg-white px-4 text-sm"
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
        />
        <button className="min-h-11 rounded-r-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
      </form>
      {open && q.trim().length >= 2 ? (
        <div id={listId} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matching products yet.</p>
          ) : (
            <ul>
              {hits.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`} className="grid grid-cols-[3rem_1fr] gap-3 px-3 py-2 hover:bg-cream-100" onClick={() => setOpen(false)}>
                    <span className="block aspect-square overflow-hidden rounded-lg bg-cream-100">
                      {product.image ? <Image src={product.image} alt="" width={64} height={64} unoptimized={unoptimizedImage(product.image)} className="h-full w-full object-cover" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-5">{product.name}</span>
                      <span className="text-xs text-muted">{product.categoryName} · {product.inStock ? <Money amount={product.price} /> : "Out of stock"}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className="block border-t border-cream-200 px-4 py-2 text-sm font-semibold text-forest-800" onClick={() => setOpen(false)}>
            See all results
          </Link>
        </div>
      ) : null}
    </div>
  );
}
