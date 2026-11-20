"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string; exact?: boolean };
type NavItem = { type: "link"; href: string; label: string; exact?: boolean } | { type: "group"; id: string; label: string; href: string; children: NavLink[] };

const items: NavItem[] = [
  { type: "link", href: "/admin", label: "Dashboard", exact: true },
  { type: "link", href: "/admin/orders", label: "Orders" },
  {
    type: "group",
    id: "analytics",
    label: "Analytics",
    href: "/admin/reports",
    children: [
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    type: "group",
    id: "boost-sales",
    label: "Boost Sales",
    href: "/admin/coupons",
    children: [
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/inquiries", label: "Inquiries" },
      { href: "/admin/promotions", label: "Website content" },
    ],
  },
  { type: "link", href: "/admin/products", label: "Products" },
  { type: "link", href: "/admin/reviews", label: "Reviews" },
  { type: "link", href: "/admin/categories", label: "Categories" },
  { type: "link", href: "/admin/inventory", label: "Inventory" },
  { type: "link", href: "/admin/payments", label: "Payments" },
];

const COLLAPSED_KEY = "bazaardost-admin-sidebar";

function pathActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavButtons({ pathname, onNavigate, collapsed = false, variant = "desktop" }: { pathname: string; onNavigate?: () => void; collapsed?: boolean; variant?: "desktop" | "mobile" }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setExpanded((current) => {
      const next = { ...current };
      for (const item of items) {
        if (item.type !== "group") continue;
        if (variant === "mobile" || pathActive(pathname, item.href) || item.children.some((child) => pathActive(pathname, child.href))) next[item.id] = true;
      }
      return next;
    });
  }, [pathname, variant]);

  const linkClass = (active: boolean) => `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? "px-2 text-center" : ""} ${active ? "bg-forest-800 text-cream-50 shadow-sm" : "text-forest-900 hover:bg-forest-800 hover:text-cream-50"}`;

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {items.map((item) => {
        if (item.type === "link") {
          const active = pathActive(pathname, item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} className={linkClass(active)}>
              {collapsed ? item.label.slice(0, 1) : item.label}
            </Link>
          );
        }
        const groupActive = pathActive(pathname, item.href) || item.children.some((child) => pathActive(pathname, child.href));
        const open = variant === "mobile" ? Boolean(expanded[item.id]) : Boolean(expanded[item.id] || hovered === item.id || groupActive);
        if (collapsed) {
          return (
            <Link key={item.id} href={item.href} onClick={onNavigate} title={item.label} className={linkClass(groupActive)}>
              {item.label.slice(0, 1)}
            </Link>
          );
        }
        return (
          <div key={item.id} onMouseEnter={() => variant === "desktop" && setHovered(item.id)} onMouseLeave={() => variant === "desktop" && setHovered((value) => (value === item.id ? null : value))}>
            <div className={`flex items-center rounded-lg transition-colors ${groupActive || open ? "bg-forest-800 text-cream-50 shadow-sm" : "text-forest-900 hover:bg-forest-800 hover:text-cream-50"}`}>
              <Link href={item.href} onClick={onNavigate} className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium">
                {item.label}
              </Link>
              <button type="button" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`} className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/15" onClick={() => setExpanded((current) => ({ ...current, [item.id]: !open }))}>
                <Chevron open={open} />
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${open ? "mt-0.5 max-h-96 opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}>
              <div className="ml-2 flex flex-col gap-0.5 border-l-2 border-forest-800/30 py-0.5 pl-2">
                {item.children.map((child) => {
                  const active = pathActive(pathname, child.href, child.exact);
                  return (
                    <Link key={child.href} href={child.href} onClick={onNavigate} className={`rounded-md px-2.5 py-2 text-[13px] font-medium ${active ? "bg-forest-800 text-cream-50" : "text-forest-900 hover:bg-forest-800 hover:text-cream-50"}`}>
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* The menu still collapses for this visit. */
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-[70vh] bg-cream-100 lg:flex">
      <aside className={`hidden shrink-0 border-r border-cream-300 bg-white lg:flex ${collapsed ? "lg:w-16" : "lg:w-60"}`}>
        <div className="sticky top-0 flex h-[calc(100vh-0px)] w-full flex-col px-2 py-4">
          <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
            {collapsed ? null : <Link href="/admin" className="truncate px-2 text-lg font-bold text-forest-900">BazaarDost Admin</Link>}
            <button type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cream-300 text-forest-900 hover:bg-cream-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={collapsed ? "M6 3.5L10.5 8L6 12.5" : "M10 3.5L5.5 8L10 12.5"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {collapsed ? null : (
            <form action="/admin/products" className="mb-4 px-1">
              <label className="sr-only" htmlFor="admin-search">Search products</label>
              <input id="admin-search" name="q" placeholder="Search products" className="min-h-11 w-full rounded-lg border border-cream-300 bg-white px-3 text-sm" />
            </form>
          )}
          <div className="flex-1 overflow-y-auto px-1 pb-2">
            <NavButtons pathname={pathname} collapsed={collapsed} />
          </div>
          {collapsed ? null : <Link href="/" className="mt-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-cream-100 hover:text-forest-900">← Storefront</Link>}
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-cream-300 bg-white lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open admin menu" aria-expanded={menuOpen} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-cream-300" onClick={() => setMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/admin" className="truncate font-bold text-forest-900">BazaarDost Admin</Link>
          </div>
          <Link href="/" className="shrink-0 text-sm text-muted">← Store</Link>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-forest-950/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,20.5rem)] flex-col bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-cream-300 px-4 py-3">
              <span className="font-bold text-forest-900">Admin menu</span>
              <button type="button" aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream-300" onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form action="/admin/products" className="border-b border-cream-200 px-3 py-3">
              <label className="sr-only" htmlFor="admin-search-mobile">Search products</label>
              <input id="admin-search-mobile" name="q" placeholder="Search products" className="min-h-11 w-full rounded-lg border border-cream-300 px-3 text-sm" />
            </form>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <NavButtons pathname={pathname} onNavigate={() => setMenuOpen(false)} variant="mobile" />
            </div>
            <Link href="/" className="border-t border-cream-300 px-4 py-3 text-sm text-muted" onClick={() => setMenuOpen(false)}>← Storefront</Link>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1 px-4 py-4 md:px-6">
        <div className="mb-4 hidden items-center justify-end gap-3 lg:flex">
          <p className="text-sm text-muted">{name} · {email}</p>
          <Link href="/account" className="text-sm font-semibold text-forest-800 underline">Account</Link>
          <button type="button" className="text-sm font-semibold text-forest-800 underline" onClick={logout}>Log out</button>
        </div>
        {children}
      </div>
    </div>
  );
}
