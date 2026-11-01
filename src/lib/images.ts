export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  if (url.startsWith("https://cdn.shopify.com/")) return true;
  const bases = [process.env.AWS_S3_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_CDN_URL, process.env.CDN_BASE_URL];
  if (bases.some((base) => base && url.startsWith(`${base.replace(/\/$/, "")}/`))) return true;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (bucket && region && url.startsWith(`https://${bucket}.s3.${region}.amazonaws.com/`)) return true;
  return false;
}
