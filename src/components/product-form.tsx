"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { slugify } from "@/lib/format";

type CategoryOption = { id: string; name: string };
type Spec = { label: string; value: string };
type Variant = { name: string; sku: string; price: number | null; stock: number };

export type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  specifications: Spec[];
  isActive: boolean;
  isFeatured: boolean;
  wholesaleEligible: boolean;
  minOrderQty: number | null;
  wholesalePrice: number | null;
  images: Array<{ url: string; alt: string }>;
  variants: Variant[];
};

export function ProductForm({ categories, initial }: { categories: CategoryOption[]; initial?: ProductFormValue }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [images, setImages] = useState((initial?.images || []).map((image) => image.url).join("\n"));
  const [specs, setSpecs] = useState((initial?.specifications || []).map((spec) => `${spec.label} | ${spec.value}`).join("\n"));
  const [variants, setVariants] = useState((initial?.variants || []).map((variant) => `${variant.name} | ${variant.sku} | ${variant.price ?? ""} | ${variant.stock}`).join("\n"));

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setMessage(data.error || "Upload failed.");
      return;
    }
    const url = data.url;
    setImages((current) => (current ? `${current}\n${url}` : url));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const numberOrNull = (key: string) => {
      const value = String(form.get(key) || "").trim();
      return value ? Number(value) : null;
    };
    const payload = {
      name,
      slug,
      sku: String(form.get("sku") || ""),
      description: String(form.get("description") || ""),
      shortDescription: String(form.get("shortDescription") || ""),
      price: Number(form.get("price")),
      compareAtPrice: numberOrNull("compareAtPrice"),
      stock: Number(form.get("stock") || 0),
      categoryId: String(form.get("categoryId") || ""),
      isActive: form.get("isActive") === "on",
      isFeatured: form.get("isFeatured") === "on",
      wholesaleEligible: form.get("wholesaleEligible") === "on",
      minOrderQty: numberOrNull("minOrderQty"),
      wholesalePrice: numberOrNull("wholesalePrice"),
      specifications: specs.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [label, ...rest] = line.split("|");
        return { label: label.trim(), value: rest.join("|").trim() };
      }),
      images: images.split("\n").map((line) => line.trim()).filter(Boolean).map((url) => ({ url, alt: name })),
      variants: variants.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [variantName, sku, price, stock] = line.split("|").map((part) => part.trim());
        return { name: variantName, sku, price: price ? Number(price) : null, stock: Number(stock || 0) };
      }),
    };
    const response = await fetch(initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    setPending(false);
    if (!response.ok || !data.id) {
      setMessage(data.error || "Could not save the product.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-3">
      <label className={labelClass}>Name<input value={name} onChange={(event) => { setName(event.target.value); if (!initial?.id) setSlug(slugify(event.target.value)); }} className={fieldClass} required /></label>
      <label className={labelClass}>Slug<input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className={fieldClass} required /></label>
      <label className={labelClass}>SKU<input name="sku" defaultValue={initial?.sku || ""} className={fieldClass} required /></label>
      <label className={labelClass}>Short description<input name="shortDescription" defaultValue={initial?.shortDescription || ""} className={fieldClass} /></label>
      <label className={labelClass}>Description<textarea name="description" defaultValue={initial?.description || ""} className={`${fieldClass} min-h-32 py-2`} required /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={labelClass}>Selling price<input name="price" type="number" min={1} defaultValue={initial?.price || ""} className={fieldClass} required /></label>
        <label className={labelClass}>Compare-at price<input name="compareAtPrice" type="number" min={1} defaultValue={initial?.compareAtPrice ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Stock without options<input name="stock" type="number" min={0} defaultValue={initial?.stock || 0} className={fieldClass} /></label>
      </div>
      <label className={labelClass}>Category
        <select name="categoryId" defaultValue={initial?.categoryId || categories[0]?.id} className={fieldClass}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} /> Active on the shop</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured ?? false} /> Featured on the homepage</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="wholesaleEligible" defaultChecked={initial?.wholesaleEligible ?? false} /> Wholesale eligible</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>Minimum wholesale quantity<input name="minOrderQty" type="number" min={1} defaultValue={initial?.minOrderQty ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Wholesale price<input name="wholesalePrice" type="number" min={1} defaultValue={initial?.wholesalePrice ?? ""} className={fieldClass} /></label>
      </div>
      <label className={labelClass}>Specifications, one per line as Label | Value
        <textarea value={specs} onChange={(event) => setSpecs(event.target.value)} className={`${fieldClass} min-h-24 py-2`} />
      </label>
      <label className={labelClass}>Options, one per line as Name | SKU | Price | Stock. Leave price empty to use the selling price.
        <textarea value={variants} onChange={(event) => setVariants(event.target.value)} className={`${fieldClass} min-h-24 py-2`} />
      </label>
      <label className={labelClass}>Image paths, one per line. Leave empty to generate a catalogue image.
        <textarea value={images} onChange={(event) => setImages(event.target.value)} className={`${fieldClass} min-h-24 py-2`} />
      </label>
      <label className={labelClass}>Upload a PNG, JPEG, or WebP<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="block text-sm" /></label>
      {message ? <p role="alert" className="text-sm text-[#7F1D1D]">{message}</p> : null}
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Saving…" : "Save product"}</button>
    </form>
  );
}

export function StatusForm({ action, fields }: { action: string; fields: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const payload = {
      ...body,
      active: body.active === "on",
      value: body.value ? Number(body.value) : undefined,
      minSubtotal: body.minSubtotal ? Number(body.minSubtotal) : undefined,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : undefined,
    };
    const response = await fetch(action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await response.json()) as { error?: string };
    setMessage(data.error || (response.ok ? "Saved." : "Could not save."));
    setPending(false);
    if (response.ok) window.location.reload();
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3">
      {fields}
      <button className={buttonClass("primary")} disabled={pending}>Save</button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
