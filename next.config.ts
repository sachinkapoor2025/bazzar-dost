import type { NextConfig } from "next";

function imageHosts(): Array<{ protocol: "https"; hostname: string }> {
  const hosts = new Map<string, { protocol: "https"; hostname: string }>();
  hosts.set("cdn.shopify.com", { protocol: "https", hostname: "cdn.shopify.com" });
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (bucket && region) {
    const hostname = `${bucket}.s3.${region}.amazonaws.com`;
    hosts.set(hostname, { protocol: "https", hostname });
  }
  const base = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (base) {
    try {
      const hostname = new URL(base).hostname;
      hosts.set(hostname, { protocol: "https", hostname });
    } catch {
      // An invalid public base is ignored here. Upload checks the value again at runtime.
    }
  }
  return [...hosts.values()];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: imageHosts(),
  },
};

export default nextConfig;
