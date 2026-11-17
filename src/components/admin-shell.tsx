"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = { href: string; label: string; exact?: boolean };
type NavItem = NavLink | { label: string; children: NavLink[] };

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  {
    label: "Analytics",
    children: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    label: "Boost sales",
    children: [
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/inquiries", label: "Inquiries" },
      { href: "/admin/promotions", label: "Website content" },
    ],
  },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/payments", label: "Payments" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-[70vh] bg-cream-100 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className={`${open ? "block" : "hidden"} border-b border-forest-800 bg-forest-950 text-cream-50 lg:block`}>
        <div className="px-4 py-4">
          <p className="font-display text-2xl leading-none">BazaarDost</p>
          <p className="mt-1 text-xs text-cream-200">Admin portal</p>
        </div>
        <nav aria-label="Admin" className="grid gap-1 px-2 pb-6">
          {items.map((item) => {
            if ("href" in item) {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-gold-400 text-forest-950" : "hover:bg-forest-800"}`}>
                  {item.label}
                </Link>
              );
            }
            const groupActive = item.children.some((child) => isActive(pathname, child.href));
            const showChildren = expanded[item.label] ?? groupActive;
            return (
              <div key={item.label} className="mt-2">
                <button
                  type="button"
                  aria-expanded={showChildren}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] ${groupActive ? "text-gold-400" : "text-cream-200"} hover:bg-forest-800`}
                  onClick={() => setExpanded((current) => ({ ...current, [item.label]: !showChildren }))}
                >
                  {item.label}
                  <span aria-hidden="true">{showChildren ? "–" : "+"}</span>
                </button>
                {showChildren ? item.children.map((child) => {
                  const active = isActive(pathname, child.href);
                  return (
                    <Link key={child.href} href={child.href} onClick={() => setOpen(false)} className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-gold-400 font-semibold text-forest-950" : "text-cream-50 hover:bg-forest-800"}`}>
                      {child.label}
                    </Link>
                  );
                }) : null}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 px-4 py-4 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm font-semibold lg:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide menu" : "Menu"}
          </button>
          <form action="/admin/products" className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="admin-search">Search products</label>
            <input id="admin-search" name="q" placeholder="Search products, SKU, or category" className="min-h-11 w-full rounded-full border border-cream-300 bg-white px-4 text-sm" />
          </form>
          <p className="hidden text-sm text-muted xl:block">{name} · {email}</p>
          <Link href="/account" className="text-sm font-semibold underline">Account</Link>
          <button type="button" className="min-h-11 rounded-full px-3 text-sm font-semibold underline" onClick={logout}>Log out</button>
        </div>
        {children}
      </div>
    </div>
  );
}
