import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { StoreChrome } from "@/components/store-chrome";
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
          <StoreChrome categories={categories} announcement={announcement}>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}
