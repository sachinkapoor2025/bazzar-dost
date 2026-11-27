"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/chat-widget";
import { SiteAnalytics } from "@/components/site-analytics";
import { VisitBeacon } from "@/components/visit-beacon";
import { Footer } from "@/components/footer";
import { Header, MobileDock } from "@/components/header";
import type { CategoryLink } from "@/lib/types";

export function StoreChrome({
  categories,
  announcement,
  children,
}: {
  categories: CategoryLink[];
  announcement: { title: string; message: string; href: string } | null;
  children: React.ReactNode;
}) {
  const admin = usePathname().startsWith("/admin");
  if (admin) return <main id="content" className="min-h-screen bg-cream-100">{children}</main>;
  return (
    <>
      {announcement ? (
        <div className="bg-forest-800 px-4 py-2 text-center text-sm leading-5 text-cream-50">
          <span className="font-semibold">{announcement.title}. </span>
          {announcement.message}{" "}
          {announcement.href ? <a className="underline" href={announcement.href}>Details</a> : null}
        </div>
      ) : null}
      <VisitBeacon />
      <Header categories={categories} />
      <main id="content" className="min-h-[60vh] pb-20 md:pb-8">{children}</main>
      <Footer categories={categories} />
      <ChatWidget />
      <SiteAnalytics />
      <MobileDock />
    </>
  );
}
