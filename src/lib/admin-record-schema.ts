import { z } from "zod";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { isAllowedImageUrl } from "@/lib/images";

const text = (max: number) => z.string().trim().max(max).optional().default("");
const day = z.string().trim().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Use a date as YYYY-MM-DD.").optional().default("");

export const shippingSettingsSchema = z.object({
  originName: text(80),
  originPhone: text(20),
  originLine: text(160),
  originCity: text(60),
  originState: text(60),
  originPincode: z.string().trim().regex(/^$|^[1-9]\d{5}$/, "Enter a 6-digit PIN or leave it empty.").default(""),
  minDays: z.string().trim().regex(/^$|^\d{1,2}$/, "Delivery days must be a number.").default(""),
  maxDays: z.string().trim().regex(/^$|^\d{1,2}$/, "Delivery days must be a number.").default(""),
  blockedPrefixes: text(200),
  allowedPrefixes: text(200),
  flat: z.coerce.number().int().min(0).max(2000),
  freeAbove: z.coerce.number().int().min(0).max(1_000_000),
  festivalName: text(80),
  festivalStart: day,
  festivalEnd: day,
});

export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;

export const DEFAULT_SHIPPING: ShippingSettings = {
  originName: "",
  originPhone: "",
  originLine: "",
  originCity: "",
  originState: "",
  originPincode: "",
  minDays: "",
  maxDays: "",
  blockedPrefixes: "",
  allowedPrefixes: "",
  flat: SHIPPING_FLAT_RUPEES,
  freeAbove: FREE_SHIPPING_ABOVE,
  festivalName: "",
  festivalStart: "",
  festivalEnd: "",
};

export const gstSettingsSchema = z.object({
  legalName: text(120),
  gstin: z.string().trim().toUpperCase().regex(/^$|^[0-9A-Z]{15}$/, "GSTIN is 15 letters and numbers, or leave it empty.").default(""),
  ratePercent: z.coerce.number().int().min(0).max(28),
});

export type GstSettings = z.infer<typeof gstSettingsSchema>;

export const DEFAULT_GST: GstSettings = { legalName: "", gstin: "", ratePercent: 0 };

export const visitSchema = z.object({
  path: z.string().trim().min(1).max(180),
  sessionId: z.string().trim().regex(/^[a-zA-Z0-9-]{8,80}$/, "Session id is not valid."),
  device: z.enum(["mobile", "tablet", "desktop"]),
  referrer: z.string().trim().max(300).optional().default(""),
});

export const cartHoldSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(120),
  name: text(80),
  phone: text(20),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(160),
    qty: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

const recordBase = {
  vendor: z.object({
    title: z.string().trim().min(2, "Enter the vendor name.").max(80),
    status: z.enum(["active", "paused"]).default("active"),
    phone: text(20),
    city: text(60),
    notes: text(500),
  }),
  "vendor-expense": z.object({
    title: z.string().trim().min(2, "Enter what this expense was for.").max(120),
    status: z.enum(["recorded", "void"]).default("recorded"),
    vendorName: z.string().trim().min(2, "Enter the vendor.").max(80),
    amount: z.coerce.number().int().min(1, "Enter an amount in rupees.").max(10_000_000),
    spentOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date."),
    note: text(300),
  }),
  expense: z.object({
    title: z.string().trim().min(2, "Enter the expense.").max(120),
    status: z.enum(["recorded", "void"]).default("recorded"),
    category: z.string().trim().min(2, "Enter a category.").max(40),
    amount: z.coerce.number().int().min(1, "Enter an amount in rupees.").max(10_000_000),
    spentOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date."),
    note: text(300),
  }),
  settlement: z.object({
    title: z.string().trim().min(2, "Enter a settlement label.").max(120),
    status: z.enum(["open", "settled"]).default("open"),
    periodStart: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the start date."),
    periodEnd: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the end date."),
    amount: z.coerce.number().int().min(0).max(10_000_000),
    method: z.enum(["cash", "bank", "upi"]),
    note: text(300),
  }),
  seo: z.object({
    title: z.string().trim().min(2, "Enter the keyword.").max(120),
    status: z.enum(["active", "paused"]).default("active"),
    landingPath: z.string().trim().max(200).refine((value) => value === "" || value.startsWith("/"), "The landing path must start with /.").default(""),
    notes: text(300),
  }),
  nudge: z.object({
    title: z.string().trim().min(2, "Enter a short title.").max(80),
    status: z.enum(["active", "paused"]).default("active"),
    message: z.string().trim().min(2, "Enter the checkout message.").max(240),
    href: z.string().trim().max(200).refine((value) => value === "" || value.startsWith("/"), "The link must start with /.").default(""),
  }),
  banner: z.object({
    title: z.string().trim().min(2, "Enter the banner title.").max(80),
    status: z.enum(["active", "paused"]).default("paused"),
    message: z.string().trim().min(2, "Enter the banner text.").max(220),
    href: z.string().trim().max(200).refine((value) => value === "" || value.startsWith("/"), "The link must start with /.").default(""),
    image: text(800).refine((value) => value === "" || isAllowedImageUrl(value), "Use an uploaded image."),
  }),
};

export const WRITABLE_KINDS = Object.keys(recordBase);

export function parseAdminWrite(kind: string, input: unknown): { title: string; status: string; payload: Record<string, string | number> } {
  const schema = recordBase[kind as keyof typeof recordBase];
  if (!schema) {
    const error = new Error("That admin record is not editable here.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  const parsed = schema.parse(input) as { title: string; status: string } & Record<string, string | number>;
  const { title, status, ...payload } = parsed;
  return { title, status, payload };
}

export const emailUploadSchema = z.object({
  emails: z.string().trim().min(3, "Paste at least one email.").max(20000),
});

export const reviewRequestSchema = z.object({
  email: z.string().trim().email("Enter the customer's email.").max(120),
  subject: z.string().trim().min(2).max(140),
  message: z.string().trim().min(2).max(5000),
});
