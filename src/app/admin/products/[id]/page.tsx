import { notFound } from "next/navigation";
import { ProductForm, type ProductFormValue } from "@/components/product-form";
import { parseSpecs } from "@/lib/catalog";
import { readDatabase } from "@/lib/db";
import { findLocalProduct, listAdminCatalogueCategories } from "@/lib/local-catalogue";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const stored = await readDatabase(null, async (client) => client.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  }));
  const local = stored ? null : findLocalProduct(id);
  const product = stored || (local ? {
    ...local,
    images: local.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants: local.variants.map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price, stock: variant.stock })),
  } : null);
  if (!product) notFound();
  const storedCategories = await readDatabase([], (client) => client.category.findMany({ orderBy: { sortOrder: "asc" } }));
  const categories = storedCategories.length > 0 ? storedCategories : listAdminCatalogueCategories().categories;
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
