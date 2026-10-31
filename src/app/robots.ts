import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/account", "/checkout", "/cart", "/wishlist", "/login", "/register", "/orders"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
