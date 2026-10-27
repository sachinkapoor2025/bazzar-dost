export const site = {
  name: "BazaarDost",
  tagline: "Discover More. Shop Smart. Grow Together.",
  description:
    "BazaarDost is an Indian shopping catalogue for everyday products, visible deals, and wholesale enquiries.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
};

export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
