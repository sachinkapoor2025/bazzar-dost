import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

export type StoredOrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  image: string;
};

export type StoredOrder = {
  id: string;
  orderNumber: string;
  accessToken: string;
  idempotencyKey: string;
  userId: string | null;
  email: string;
  name: string;
  phone: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  trackingNote: string;
  createdAt: string;
  updatedAt: string;
  items: StoredOrderItem[];
};

const FILE = path.join(process.cwd(), "data", "orders.json");

export function listLocalOrders(): StoredOrder[] {
  return readJsonArray<StoredOrder>(FILE).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function saveLocalOrders(rows: StoredOrder[]): boolean {
  return writeJsonArray(FILE, rows);
}

export function datedOrder<T extends { createdAt: string; updatedAt?: string }>(order: T) {
  return { ...order, createdAt: new Date(order.createdAt), updatedAt: new Date(order.updatedAt || order.createdAt) };
}

export function newOrderId() {
  return randomUUID();
}
