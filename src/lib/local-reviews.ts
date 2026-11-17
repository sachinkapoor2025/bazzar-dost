import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

export type StoredStoreReview = {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type StoredProductReview = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productSlug: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const STORE_FILE = path.join(process.cwd(), "data", "store-reviews.json");
const PRODUCT_FILE = path.join(process.cwd(), "data", "product-reviews.json");

export function listStoreReviews(): StoredStoreReview[] {
  return readJsonArray<StoredStoreReview>(STORE_FILE).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function saveStoreReview(input: Omit<StoredStoreReview, "id" | "createdAt">): StoredStoreReview | null {
  const review: StoredStoreReview = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  const rows = [review, ...listStoreReviews()].slice(0, 100);
  return writeJsonArray(STORE_FILE, rows) ? review : null;
}

export function listProductReviews(): StoredProductReview[] {
  return readJsonArray<StoredProductReview>(PRODUCT_FILE).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function saveProductReviewRecord(input: Omit<StoredProductReview, "id" | "createdAt">): StoredProductReview | null {
  const review: StoredProductReview = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  const rows = listProductReviews();
  if (rows.some((item) => item.userId === review.userId && item.productSlug === review.productSlug)) return null;
  return writeJsonArray(PRODUCT_FILE, [review, ...rows]) ? review : null;
}

export function deleteProductReviewRecord(id: string): boolean {
  const rows = listProductReviews();
  const next = rows.filter((review) => review.id !== id);
  if (next.length === rows.length) return false;
  return writeJsonArray(PRODUCT_FILE, next);
}
