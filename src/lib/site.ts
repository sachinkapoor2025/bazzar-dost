export const PRODUCTION_SITE_URL = "https://bazaardost.com";

export function resolveSiteUrl(
  configured: string | null | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  if (nodeEnv === "production") return PRODUCTION_SITE_URL;
  const value = configured?.trim().replace(/\/$/, "") || "";
  return value || "http://localhost:3000";
}

function hostnameOf(value: string): string {
  return value.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "") || "";
}

export function canonicalRedirectTarget(
  hosts: Array<string | null | undefined>,
  pathname: string,
  search = "",
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string | null {
  if (nodeEnv !== "production") return null;
  const names = hosts.map((host) => hostnameOf(host || "")).filter(Boolean);
  if (names.length === 0 || names.includes("bazaardost.com")) return null;
  const alias = names.some((host) => host === "www.bazaardost.com" || host.endsWith(".amplifyapp.com"));
  if (!alias) return null;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${PRODUCTION_SITE_URL}${path}${query}`;
}

export const site = {
  name: "BazaarDost",
  tagline: "Discover More. Shop Smart. Grow Together.",
  description:
    "BazaarDost is an Indian shopping catalogue for everyday products, visible deals, and wholesale enquiries.",
  url: resolveSiteUrl(),
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
