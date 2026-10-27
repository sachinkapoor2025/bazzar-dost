import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header, MobileDock } from "@/components/header";
import { Providers } from "@/components/providers";
import { getAnnouncement, getCategories } from "@/lib/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: site.url,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let announcement: Awaited<ReturnType<typeof getAnnouncement>> = null;
  try {
    [categories, announcement] = await Promise.all([getCategories(), getAnnouncement()]);
  } catch (error) {
    console.error(error);
  }

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <a href="#content" className="skip-link">Skip to content</a>
        <Providers>
          {announcement ? (
            <div className="bg-forest-800 px-4 py-2 text-center text-sm text-cream-50">
              <span className="font-semibold">{announcement.title}. </span>
              {announcement.message}{" "}
              {announcement.href ? <a className="underline" href={announcement.href}>Details</a> : null}
            </div>
          ) : null}
          <Header categories={categories} />
          <main id="content" className="min-h-[60vh] pb-20 md:pb-8">{children}</main>
          <Footer categories={categories} />
          <MobileDock />
        </Providers>
      </body>
    </html>
  );
}
