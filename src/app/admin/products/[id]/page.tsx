import { notFound } from "next/navigation";
import { ProductForm, type ProductFormValue } from "@/components/product-form";
import { parseSpecs } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await prisma.product.findUnique({
    where: { id: (await params).id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
  if (!product) notFound();
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const initial: ProductFormValue = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    categoryId: product.categoryId,
    specifications: parseSpecs(product.specifications),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    wholesaleEligible: product.wholesaleEligible,
    minOrderQty: product.minOrderQty,
    wholesalePrice: product.wholesalePrice,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants: product.variants.map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price, stock: variant.stock })),
  };
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Edit product</h1>
      <ProductForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} initial={initial} />
    </div>
  );
}
