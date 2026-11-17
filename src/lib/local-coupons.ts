import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

export type StoredCoupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  active: boolean;
  note: string;
  expiresAt: string | null;
};

const FILE = path.join(process.cwd(), "data", "coupons.json");

const published: StoredCoupon = {
  id: "cpn_welcome50",
  code: "WELCOME50",
  type: "FIXED",
  value: 50,
  minSubtotal: 499,
  active: true,
  note: "Shown on the homepage",
  expiresAt: null,
};

function storedCoupons(): StoredCoupon[] {
  return readJsonArray<StoredCoupon>(FILE);
}

export function listLocalCoupons(): StoredCoupon[] {
  const byCode = new Map<string, StoredCoupon>([[published.code, published]]);
  for (const coupon of storedCoupons()) byCode.set(coupon.code.toUpperCase(), { ...coupon, code: coupon.code.toUpperCase() });
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function findLocalCoupon(code: string): StoredCoupon | null {
  const coupon = listLocalCoupons().find((item) => item.code === code.trim().toUpperCase());
  if (!coupon || !coupon.active) return null;
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) return null;
  return coupon;
}

export function saveLocalCoupon(input: Omit<StoredCoupon, "id"> & { id?: string }): StoredCoupon | null {
  const rows = storedCoupons().filter((coupon) => coupon.code.toUpperCase() !== published.code);
  const code = input.code.trim().toUpperCase();
  const next: StoredCoupon = {
    id: input.id || randomUUID(),
    code,
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal,
    active: input.active,
    note: input.note,
    expiresAt: input.expiresAt,
  };
  const index = rows.findIndex((coupon) => coupon.id === next.id || coupon.code.toUpperCase() === code);
  if (index >= 0) rows[index] = next;
  else rows.push(next);
  if (code === published.code) {
    const publishedRow = rows.find((coupon) => coupon.code === published.code);
    if (publishedRow) publishedRow.id = published.id;
    next.id = published.id;
  }
  return writeJsonArray(FILE, rows) ? next : null;
}
