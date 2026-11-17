import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma, databaseConfigured } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { findLocalProduct } from "@/lib/local-catalogue";
import { syncLocalWishlist } from "@/lib/local-wishlist";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = z.object({ productIds: z.array(z.string()).max(50) }).parse(await request.json());
    if (!databaseConfigured()) {
      const productIds = body.productIds.filter((id) => {
        const product = findLocalProduct(id);
        return Boolean(product && product.isActive);
      });
      const saved = syncLocalWishlist(user.id, productIds);
      if (!saved) return NextResponse.json({ error: "The wishlist cannot be saved right now." }, { status: 503 });
      return NextResponse.json({ productIds: saved });
    }
    const products = await prisma.product.findMany({ where: { id: { in: body.productIds }, isActive: true }, select: { id: true } });
    for (const product of products) {
      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        update: {},
        create: { userId: user.id, productId: product.id },
      });
    }
    const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
    return NextResponse.json({ productIds: items.map((item) => item.productId) });
  } catch (error) {
    return errorResponse(error);
  }
}
