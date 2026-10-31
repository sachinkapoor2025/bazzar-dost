import { NextResponse } from "next/server";
import { searchCards } from "@/lib/catalog";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") || "";
  const products = await searchCards(q, 6);
  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      categoryName: product.categoryName,
      inStock: product.inStock,
    })),
  });
}
