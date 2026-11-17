import "server-only";
import path from "node:path";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

type WishRow = { userId: string; productId: string };

const FILE = path.join(process.cwd(), "data", "wishlist.json");

function rows(): WishRow[] {
  return readJsonArray<WishRow>(FILE);
}

export function localWishlistIds(userId: string): string[] {
  return rows().filter((row) => row.userId === userId).map((row) => row.productId);
}

export function toggleLocalWishlist(userId: string, productId: string): { saved: boolean; ok: boolean } {
  const current = rows();
  const index = current.findIndex((row) => row.userId === userId && row.productId === productId);
  if (index >= 0) current.splice(index, 1);
  else current.push({ userId, productId });
  return { saved: index < 0, ok: writeJsonArray(FILE, current) };
}

export function syncLocalWishlist(userId: string, productIds: string[]): string[] | null {
  const current = rows();
  const mine = new Set(current.filter((row) => row.userId === userId).map((row) => row.productId));
  for (const productId of productIds) {
    if (mine.has(productId) || mine.size >= 50) continue;
    current.push({ userId, productId });
    mine.add(productId);
  }
  if (!writeJsonArray(FILE, current)) return null;
  return [...mine];
}
