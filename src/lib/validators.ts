import { z } from "zod";
import { INDIAN_STATES } from "@/lib/states";
import { MAX_LINE_QTY } from "@/lib/commerce";
import { isAllowedImageUrl } from "@/lib/images";

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => value === "" || /^[6-9]\d{9}$/.test(value), "Enter a 10-digit Indian mobile number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  phone,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone,
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40).default("Home"),
  fullName: z.string().trim().min(2, "Enter the recipient name.").max(80),
  phone: phone.refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a 10-digit Indian mobile number."),
  line1: z.string().trim().min(5, "Enter the address.").max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: "Choose a state." }) }),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code."),
  isDefault: z.boolean().optional().default(false),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  qty: z.number().int().min(1).max(MAX_LINE_QTY),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid("Start checkout again."),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: phone.refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a 10-digit Indian mobile number."),
  line1: z.string().trim().min(5).max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80),
  state: z.enum(INDIAN_STATES),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code."),
  notes: z.string().trim().max(400).optional().default(""),
  couponCode: z.string().trim().max(40).optional().default(""),
  items: z.array(cartItemSchema).min(1, "Your cart is empty.").max(30),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone,
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const wholesaleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  business: z.string().trim().min(2, "Enter the business name.").max(120),
  email: z.string().trim().email().max(120),
  phone: phone.refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a 10-digit Indian mobile number."),
  city: z.string().trim().min(2).max(80),
  productInterest: z.string().trim().min(2).max(200),
  quantity: z.string().trim().min(1).max(40),
  message: z.string().trim().min(10).max(2000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email().max(120),
});

export const trackSchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  email: z.string().trim().email(),
});

export const forgotSchema = z.object({
  email: z.string().trim().email(),
});

export const resetSchema = z.object({
  token: z.string().trim().min(20),
  password: registerSchema.shape.password,
});

const specSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(160),
});

const imageSchema = z.object({
  url: z.string().trim().min(1).max(800),
  alt: z.string().trim().max(160).optional().default(""),
});

const variantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sku: z.string().trim().min(2).max(40),
  price: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).max(100000),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug."),
  sku: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(30000),
  shortDescription: z.string().trim().max(220).optional().default(""),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).max(100000),
  categoryId: z.string().min(1),
  specifications: z.array(specSchema).max(20).optional().default([]),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  wholesaleEligible: z.boolean(),
  minOrderQty: z.number().int().positive().max(10000).nullable().optional(),
  wholesalePrice: z.number().int().positive().nullable().optional(),
  images: z.array(imageSchema).max(24).optional().default([]),
  variants: z.array(variantSchema).max(12).optional().default([]),
}).superRefine((value, ctx) => {
  if (value.compareAtPrice != null && value.compareAtPrice <= value.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["compareAtPrice"],
      message: "Compare-at price must be higher than the selling price, or left empty.",
    });
  }
  if (value.wholesalePrice != null && value.wholesalePrice > value.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["wholesalePrice"],
      message: "Wholesale price cannot be higher than the selling price.",
    });
  }
  if (value.images.some((image) => !isAllowedImageUrl(image.url))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["images"],
      message: "Use an uploaded image path or a Shopify catalogue image URL.",
    });
  }
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(400).optional().default(""),
  image: z.string().trim().max(800).optional().default(""),
  sortOrder: z.number().int().min(0).max(999),
}).superRefine((value, ctx) => {
  if (value.image && !isAllowedImageUrl(value.image)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["image"],
      message: "Use an uploaded category image, or leave it empty.",
    });
  }
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive(),
  minSubtotal: z.number().int().min(0),
  active: z.boolean(),
  note: z.string().trim().max(240).optional().default(""),
  expiresAt: z.string().trim().optional().default(""),
}).superRefine((value, ctx) => {
  if (value.type === "PERCENT" && value.value > 90) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Percent coupons are capped at 90%." });
  }
});

export const promotionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  message: z.string().trim().min(2).max(220),
  href: z.string().trim().max(200).optional().default(""),
  kind: z.enum(["announcement", "banner"]),
  active: z.boolean(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
  trackingNote: z.string().trim().max(300).optional().default(""),
});

export const inquiryStatusSchema = z.object({
  status: z.enum(["new", "in_review", "closed"]),
});

export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(60),
  city: z.string().trim().max(40).optional().default(""),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  comment: z.string().trim().min(10, "Write at least a short review.").max(600),
  website: z.string().optional().default(""),
});
