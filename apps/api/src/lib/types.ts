export type ImageRecord = { id: string; url: string; alt: string; sortOrder: number };
export type VariantRecord = { id: string; name: string; sku: string; price: number | null; stock: number; image: string };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  parentId: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  specifications: string;
  isActive: boolean;
  isFeatured: boolean;
  wholesaleEligible: boolean;
  minOrderQty: number | null;
  wholesalePrice: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  images: ImageRecord[];
  variants: VariantRecord[];
  version: number;
};

export type HydratedProduct = Product & {
  category: { id: string; name: string; slug: string; parent: { name: string; slug: string } | null };
};

export type ProductCard = {
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
  variants: VariantRecord[];
};

export type OrderItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  image: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  accessToken: string;
  idempotencyKey: string | null;
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
  items: OrderItem[];
};

export type PublicUser = { id: string; email: string; name: string; phone: string; role: string };

export type Address = {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  active: boolean;
  expiresAt: string | null;
  note: string;
};

export type Promotion = {
  id: string;
  title: string;
  message: string;
  href: string;
  kind: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type Inquiry = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  city: string;
  subject: string;
  message: string;
  productInterest: string;
  quantity: string;
  status: string;
  createdAt: string;
};

export type Review = {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  createdAt: string;
};
