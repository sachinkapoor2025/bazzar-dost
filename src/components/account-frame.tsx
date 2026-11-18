"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonClass } from "@/components/ui";
import type { PublicUser } from "@/lib/types";

const tabs: { href: string; label: string; match: string[]; icon: ReactNode }[] = [
  {
    href: "/account/orders",
    label: "Orders",
    match: ["/account", "/account/orders"],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    match: ["/account/addresses"],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.828 0l-4.243-4.243a8 8 0 1 1 11.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    ),
  },
  {
    href: "/account/payments",
    label: "Payment methods",
    match: ["/account/payments"],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" />
      </svg>
    ),
  },
  {
    href: "/account/profile",
    label: "Account details",
    match: ["/account/profile"],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
    ),
  },
];

const logoutClass = "inline-flex items-center gap-2 rounded-lg border border-cream-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 transition hover:border-forest-800 hover:bg-cream-100";

export function AccountFrame({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-[70vh] bg-cream-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 rounded-xl bg-gradient-to-r from-forest-800 via-forest-700 to-forest-950 px-6 py-8 text-center text-cream-50 shadow-card sm:px-10 sm:py-10 sm:text-left">
          <p className="mx-auto max-w-3xl text-lg font-medium leading-relaxed sm:mx-0 sm:text-xl">
            Welcome back to your account. Manage orders, addresses and profile details easily.
          </p>
        </div>
        <div className="rounded-xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-forest-900 sm:text-3xl">My Account</h1>
              <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/wishlist" className="text-sm font-semibold text-forest-800 underline">Wishlist</Link>
              {user.role === "admin" ? <Link href="/admin" className={buttonClass("primary")}>Admin Dashboard</Link> : null}
              <SignOutButton className={logoutClass} />
            </div>
          </div>
          <nav aria-label="Account" className="flex flex-wrap gap-x-6 gap-y-3 pt-1 sm:gap-x-10">
            {tabs.map((tab) => {
              const active = tab.match.some((path) => pathname === path || (path !== "/account" && pathname.startsWith(`${path}/`)));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "inline-flex items-center gap-2 border-b-2 border-forest-900 pb-1 text-sm font-semibold text-forest-900" : "inline-flex items-center gap-2 border-b-2 border-transparent pb-1 text-sm font-semibold text-muted hover:border-cream-300 hover:text-forest-900"}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6">{children}</div>
          <div className="mt-8 flex justify-end border-t border-cream-200 pt-6">
            <SignOutButton className="inline-flex items-center gap-2 rounded-lg bg-cream-100 px-5 py-2.5 text-sm font-semibold text-forest-900 hover:bg-cream-200" label="Log out of your account" />
          </div>
        </div>
      </div>
    </div>
  );
}
