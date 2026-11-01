import "server-only";
import { ApiError, api } from "@/lib/backend";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type ItemInput = { productId: string; variantId?: string | null; qty: number };

type PlaceInput = {
  idempotencyKey: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
  couponCode: string;
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  items: ItemInput[];
};

export async function placeOrder(input: PlaceInput) {
  try {
    return await api<{ orderNumber: string; accessToken: string }>("/orders", { body: input });
  } catch (error) {
    if (error instanceof ApiError) throw new OrderError(error.message, error.status);
    throw error;
  }
}
