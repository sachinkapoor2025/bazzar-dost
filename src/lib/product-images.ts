import unavailableImageUrls from "../data/unavailable-image-urls.json";

const unavailableImages = new Set<string>(unavailableImageUrls);

export function isGeneratedArt(url: string): boolean {
  return url.startsWith("/media/") && url.endsWith(".svg");
}

export function isLoadableProductImage(url: string): boolean {
  if (!url || unavailableImages.has(url) || isGeneratedArt(url)) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return url.startsWith("https://");
}

export function displayImages<T extends { url: string }>(images: T[]): T[] {
  return images.filter((image) => isLoadableProductImage(image.url));
}

export type ListingIdentity = {
  id: string;
  sku: string;
  name: string;
  price: number;
};

function listingKey(product: ListingIdentity): string {
  const name = product.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${name}|${product.price}`;
}

// A second import stored the same title and price under an HE- SKU and a shortened slug.
// Hide that extra row when the original listing is still shown. Unique HE- products stay.
export function duplicateListingIds(products: ListingIdentity[]): Set<string> {
  const groups = new Map<string, ListingIdentity[]>();
  for (const product of products) {
    const key = listingKey(product);
    const group = groups.get(key);
    if (group) group.push(product);
    else groups.set(key, [product]);
  }
  const hidden = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    if (!group.some((product) => !product.sku.startsWith("HE-"))) continue;
    for (const product of group) {
      if (product.sku.startsWith("HE-")) hidden.add(product.id);
    }
  }
  return hidden;
}
