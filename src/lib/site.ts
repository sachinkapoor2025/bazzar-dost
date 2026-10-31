export const site = {
  name: "BazaarDost",
  tagline: "Discover More. Shop Smart. Grow Together.",
  description:
    "BazaarDost is an Indian shopping catalogue for everyday products, visible deals, and wholesale enquiries.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  social: [
    ["Instagram", process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || ""],
    ["Facebook", process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || ""],
    ["YouTube", process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || ""],
  ].filter((entry): entry is [string, string] => Boolean(entry[1])),
};

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = site.url.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
