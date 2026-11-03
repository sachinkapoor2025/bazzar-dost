"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/payments", "Payments"],
  ["/admin/coupons", "Coupons"],
  ["/admin/promotions", "Website content"],
  ["/admin/inquiries", "Inquiries"],
  ["/admin/reports", "Reports"],
];

export function AdminShell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-[70vh] bg-cream-100 md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className={`${open ? "block" : "hidden"} border-b border-forest-800 bg-forest-900 text-cream-50 md:block`}>
        <div className="px-4 py-4">
          <p className="font-display text-2xl leading-none">BazaarDost</p>
          <p className="mt-1 text-xs text-cream-200">Store admin</p>
        </div>
        <nav aria-label="Admin" className="grid px-2 pb-4">
          {links.map(([href, label]) => {
            const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${active ? "bg-gold-400 text-forest-950" : "hover:bg-forest-800"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 px-4 py-4 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm font-semibold md:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide menu" : "Menu"}
          </button>
          <form action="/admin/products" className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="admin-search">Search products</label>
            <input id="admin-search" name="q" placeholder="Search products, SKU, or category" className="min-h-11 w-full rounded-full border border-cream-300 bg-white px-4 text-sm" />
          </form>
          <p className="hidden text-sm text-muted lg:block">{name} · {email}</p>
          <button type="button" className="min-h-11 rounded-full px-3 text-sm font-semibold underline" onClick={logout}>Log out</button>
        </div>
        {children}
      </div>
    </div>
  );
}
