import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import { StoreChrome } from "@/components/store-chrome";
import { getAnnouncement, getCategories } from "@/lib/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", preload: false });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "192x192" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: site.url,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/og.png"],
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
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="" />
        <a href="#content" className="skip-link">Skip to content</a>
        <Providers>
          <StoreChrome categories={categories} announcement={announcement}>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}
