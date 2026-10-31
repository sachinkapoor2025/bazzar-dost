export type VariantData = {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  image: string;
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  fromPrice: boolean;
  image: string;
  imageAlt: string;
  categoryName: string;
  categorySlug: string;
  inStock: boolean;
  stock: number;
  sku: string;
  shortDescription: string;
  hasVariants: boolean;
  variants: VariantData[];
};

export type Spec = { label: string; value: string };

export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  unitPrice: number;
  image: string;
  sku: string;
  qty: number;
  maxQty: number;
};

export type CategoryLink = {
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  label: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
};
