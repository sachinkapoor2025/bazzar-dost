import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { couponDiscount, orderTotal, shippingCharge, MAX_LINE_QTY } from "@/lib/commerce";

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

function orderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let value = "BD-";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

function asOrderError(error: unknown): OrderError | null {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (current instanceof OrderError) return current;
    if (typeof current === "object" && current && "cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }
    break;
  }
  return null;
}

export async function placeOrder(input: PlaceInput) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) {
    if (existing.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new OrderError("This checkout was already used.", 409);
    }
    return existing;
  }

  const code = input.couponCode.trim().toUpperCase();
  const coupon = code
    ? await prisma.coupon.findFirst({
        where: { code, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      })
    : null;
  if (code && !coupon) throw new OrderError("That coupon is not valid.");

  try {
    return await prisma.$transaction(async (tx) => {
      const duplicate = await tx.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { items: true },
      });
      if (duplicate) return duplicate;

      const lines: Array<{
        productId: string;
        variantId: string | null;
        name: string;
        sku: string;
        unitPrice: number;
        qty: number;
        image: string;
      }> = [];
      let subtotal = 0;

      for (const item of input.items) {
        if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_LINE_QTY) {
          throw new OrderError("Check the quantities in your cart.");
        }
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
        });
        if (!product || !product.isActive) throw new OrderError("A product in your cart is no longer available.");

        let unitPrice = product.price;
        let sku = product.sku;
        let name = product.name;
        let variantId: string | null = null;

        if (product.variants.length > 0) {
          const variant = product.variants.find((entry) => entry.id === item.variantId);
          if (!variant) throw new OrderError(`Choose an option for ${product.name}.`);
          const updated = await tx.variant.updateMany({
            where: { id: variant.id, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty } },
          });
          if (updated.count !== 1) throw new OrderError(`${product.name} (${variant.name}) does not have enough stock.`);
          unitPrice = variant.price ?? product.price;
          sku = variant.sku;
          name = `${product.name} — ${variant.name}`;
          variantId = variant.id;
        } else {
          if (item.variantId) throw new OrderError(`That option is not available for ${product.name}.`);
          const updated = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty } },
          });
          if (updated.count !== 1) throw new OrderError(`${product.name} does not have enough stock.`);
        }

        subtotal += unitPrice * item.qty;
        lines.push({
          productId: product.id,
          variantId,
          name,
          sku,
          unitPrice,
          qty: item.qty,
          image: product.images[0]?.url || "",
        });
      }

      const discount = coupon ? couponDiscount(subtotal, coupon) : 0;
      if (coupon && discount <= 0) {
        throw new OrderError(`That coupon needs a subtotal of at least ₹${coupon.minSubtotal}.`);
      }
      const shipping = shippingCharge(subtotal - discount);
      const total = orderTotal(subtotal, discount, shipping);

      return tx.order.create({
        data: {
          orderNumber: orderNumber(),
          accessToken: crypto.randomBytes(24).toString("hex"),
          idempotencyKey: input.idempotencyKey,
          userId: input.userId,
          email: input.email.toLowerCase(),
          name: input.name,
          phone: input.phone,
          subtotal,
          discount,
          shipping,
          total,
          couponCode: coupon ? coupon.code : "",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          status: "placed",
          addressLine1: input.address.line1,
          addressLine2: input.address.line2,
          city: input.address.city,
          state: input.address.state,
          pincode: input.address.pincode,
          notes: input.notes,
          items: { create: lines },
        },
        include: { items: true },
      });
    });
  } catch (error) {
    const orderError = asOrderError(error);
    if (orderError) throw orderError;
    const again = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    });
    if (again) return again;
    throw error;
  }
}
