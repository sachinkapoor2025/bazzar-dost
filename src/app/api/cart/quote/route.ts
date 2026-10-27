import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_LINE_QTY, sellingPrice } from "@/lib/commerce";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { cartItemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = z.object({ items: z.array(cartItemSchema).max(30) }).parse(await request.json());
    const lines = [];
    for (const item of body.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
      });
      const key = `${item.productId}:${item.variantId || ""}`;
      if (!product || !product.isActive) {
        lines.push({
          key,
          productId: item.productId,
          variantId: item.variantId || null,
          slug: "",
          name: "Unavailable product",
          variantName: null,
          unitPrice: 0,
          image: "",
          sku: "",
          qty: item.qty,
          maxQty: 0,
          available: false,
          message: "This product is no longer available.",
        });
        continue;
      }
      const image = product.images[0]?.url || "";
      if (product.variants.length > 0) {
        const variant = product.variants.find((entry) => entry.id === item.variantId);
        if (!variant) {
          lines.push({
            key, productId: product.id, variantId: item.variantId || null, slug: product.slug, name: product.name,
            variantName: null, unitPrice: product.price, image, sku: product.sku, qty: item.qty, maxQty: 0, available: false,
            message: "Choose an option again on the product page.",
          });
          continue;
        }
        const qty = Math.min(item.qty, variant.stock, MAX_LINE_QTY);
        lines.push({
          key, productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, variantName: variant.name,
          unitPrice: sellingPrice(product.price, variant.price), image: variant.image || image, sku: variant.sku,
          qty, maxQty: Math.min(variant.stock, MAX_LINE_QTY), available: qty > 0,
          message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
        });
      } else {
        const qty = Math.min(item.qty, product.stock, MAX_LINE_QTY);
        lines.push({
          key, productId: product.id, variantId: null, slug: product.slug, name: product.name, variantName: null,
          unitPrice: product.price, image, sku: product.sku, qty, maxQty: Math.min(product.stock, MAX_LINE_QTY), available: qty > 0,
          message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
        });
      }
    }
    return NextResponse.json({ lines });
  } catch (error) {
    return errorResponse(error);
  }
}
