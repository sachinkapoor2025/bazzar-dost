import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/format";

const prisma = new PrismaClient();
const csvPath = process.argv[2] || "C:/Users/dell/Downloads/shopify-products (5).csv";

type ParentSpec = { slug: string; name: string; description: string; sortOrder: number };

const parents: ParentSpec[] = [
  { slug: "home-kitchen", name: "Home & Kitchen", description: "Tools and containers for everyday cooking and storage.", sortOrder: 1 },
  { slug: "electronics-accessories", name: "Electronics & Accessories", description: "Small accessories for phones, desks, and charging.", sortOrder: 2 },
  { slug: "beauty-personal-care", name: "Beauty & Personal Care", description: "Simple personal-care products for daily use.", sortOrder: 3 },
  { slug: "fashion-bags", name: "Fashion & Bags", description: "Bags and wraps sized for regular use.", sortOrder: 4 },
  { slug: "toys-gifts", name: "Toys & Gifts", description: "Small gifts and playthings with plain materials.", sortOrder: 5 },
  { slug: "car-bike-accessories", name: "Car & Bike Accessories", description: "Compact accessories for cars and two-wheelers.", sortOrder: 6 },
  { slug: "lifestyle", name: "Lifestyle Products", description: "Home pieces for daily routines.", sortOrder: 7 },
  { slug: "office-stationery", name: "Office & Stationery", description: "Notebooks, pens, and desk storage.", sortOrder: 8 },
  { slug: "home-decor", name: "Home Decor", description: "Wall coverings, clocks, and decorative pieces from the supplier catalogue.", sortOrder: 9 },
  { slug: "garden-outdoor", name: "Garden & Outdoor", description: "Garden and outdoor items from the supplier catalogue.", sortOrder: 10 },
  { slug: "tools-hardware", name: "Tools & Hardware", description: "Hardware and hand tools from the supplier catalogue.", sortOrder: 11 },
  { slug: "health-fitness", name: "Health & Fitness", description: "Massagers, exercise items, and scales from the supplier catalogue.", sortOrder: 12 },
  { slug: "pet-supplies", name: "Pet Supplies", description: "Pet supplies from the supplier catalogue.", sortOrder: 13 },
  { slug: "cleaning-household", name: "Cleaning & Household", description: "Cleaners and household cleaning tools from the supplier catalogue.", sortOrder: 14 },
  { slug: "safety-products", name: "Safety Products", description: "Safety products from the supplier catalogue.", sortOrder: 15 },
];

const typeParent: Record<string, string> = {
  "Home & Kitchen": "home-kitchen",
  "Bathroom Accessories": "home-kitchen",
  "WATER BOTTLES": "home-kitchen",
  Humidifier: "home-kitchen",
  Beauty: "beauty-personal-care",
  COSMATIC: "beauty-personal-care",
  "Health & Personal Care": "beauty-personal-care",
  "Mobile Accessories": "electronics-accessories",
  "Computer Accessories": "electronics-accessories",
  Electronics: "electronics-accessories",
  "Electrical Plugs And Converters": "electronics-accessories",
  "Light & Tourch": "electronics-accessories",
  "Car And Bike Accessories": "car-bike-accessories",
  "Toys Products": "toys-gifts",
  "Baby Products": "toys-gifts",
  Fashion: "fashion-bags",
  Bag: "fashion-bags",
  "WINTER COLLECTION": "fashion-bags",
  "Home Decor": "home-decor",
  Wallpaper: "home-decor",
  Clock: "home-decor",
  "Garden & Outdoor": "garden-outdoor",
  "Hardware Products": "tools-hardware",
  Massager: "health-fitness",
  "Sports Fitness And Exercise": "health-fitness",
  "Weight Scale": "health-fitness",
  "Stationery & Office Supplies": "office-stationery",
  "Packing Material": "office-stationery",
  "Pet Supplies": "pet-supplies",
  "All Purpose Cleaners": "cleaning-household",
  "Safety Products": "safety-products",
  "Monsoon Collection": "garden-outdoor",
  "All Products": "home-kitchen",
};

const directTypes = new Set([
  "Home & Kitchen",
  "Garden & Outdoor",
  "Home Decor",
  "Pet Supplies",
  "Safety Products",
  "Stationery & Office Supplies",
  "Car And Bike Accessories",
]);

const childNames: Record<string, string> = {
  COSMATIC: "Cosmetics",
  "Light & Tourch": "Lights & Torches",
  "WATER BOTTLES": "Water Bottles",
  Bag: "Bags",
  "Toys Products": "Toys",
  "Hardware Products": "Hardware",
  "Baby Products": "Baby",
  "All Purpose Cleaners": "Cleaners",
  "Sports Fitness And Exercise": "Sports & Exercise",
  "Weight Scale": "Weight Scales",
  "Packing Material": "Packing Material",
  "Electrical Plugs And Converters": "Plugs & Converters",
  "Computer Accessories": "Computer Accessories",
  "Mobile Accessories": "Mobile Accessories",
  "Bathroom Accessories": "Bathroom Accessories",
  "Health & Personal Care": "Health & Personal Care",
  Beauty: "Beauty",
  Electronics: "Electronics",
  Humidifier: "Humidifiers",
  Wallpaper: "Wallpaper",
  Clock: "Clocks",
  Massager: "Massagers",
  Fashion: "Fashion",
  "Winter Wear": "Winter Wear",
};

type VariantRow = {
  optionName: string;
  optionValue: string;
  sku: string;
  price: string;
  compareAt: string;
  qty: string;
  grams: string;
};

type ImageRow = { src: string; alt: string; position: number };

type CsvProduct = {
  handle: string;
  title: string;
  body: string;
  type: string;
  status: string;
  published: string;
  variants: VariantRow[];
  images: ImageRow[];
};

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (quoted) {
      if (char === "\"") {
        if (csv[i + 1] === "\"") {
          cur += "\"";
          i += 1;
        } else quoted = false;
      } else cur += char;
    } else if (char === "\"") quoted = true;
    else if (char === ",") {
      row.push(cur);
      cur = "";
    } else if (char === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (char !== "\r") cur += char;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function foldText(value: string): string {
  return [...value].map((char) => {
    const code = char.codePointAt(0) || 0;
    const ranges: Array<[number, number, number]> = [
      [0x1D400, 0x1D419, 0x41],
      [0x1D41A, 0x1D433, 0x61],
      [0x1D434, 0x1D44D, 0x41],
      [0x1D44E, 0x1D467, 0x61],
      [0x1D468, 0x1D481, 0x41],
      [0x1D482, 0x1D49B, 0x61],
      [0x1D538, 0x1D551, 0x41],
      [0x1D552, 0x1D56B, 0x61],
      [0x1D5A0, 0x1D5B9, 0x41],
      [0x1D5BA, 0x1D5D3, 0x61],
      [0x1D5D4, 0x1D5ED, 0x41],
      [0x1D5EE, 0x1D607, 0x61],
      [0x1D608, 0x1D621, 0x41],
      [0x1D622, 0x1D63B, 0x61],
      [0x1D63C, 0x1D655, 0x41],
      [0x1D656, 0x1D66F, 0x61],
      [0x1D670, 0x1D689, 0x41],
      [0x1D68A, 0x1D6A3, 0x61],
    ];
    for (const [start, end, base] of ranges) {
      if (code >= start && code <= end) return String.fromCharCode(base + code - start);
    }
    return code > 0xFFFF ? "" : char;
  }).join("");
}

function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function rupees(value: string): { amount: number | null; fractional: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { amount: null, fractional: false };
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return { amount: null, fractional: false };
  const amount = Math.round(num);
  return { amount, fractional: Math.abs(num - amount) > 0.001 };
}

function assign(title: string, type: string): { parent: string; child: string | null } {
  const text = title.toLowerCase();
  if (type === "WINTER COLLECTION") {
    if (/grill|barbeque|bbq/.test(text)) return { parent: "home-kitchen", child: null };
    if (/grip/.test(text)) return { parent: "health-fitness", child: "Sports & Exercise" };
    if (/mini ac|fan/.test(text)) return { parent: "electronics-accessories", child: "Electronics" };
    return { parent: "fashion-bags", child: "Winter Wear" };
  }
  if (type === "Monsoon Collection") {
    if (/fan/.test(text)) return { parent: "electronics-accessories", child: "Electronics" };
    return { parent: "garden-outdoor", child: null };
  }
  if (type === "Fashion" && /screwdriver/.test(text)) return { parent: "tools-hardware", child: "Hardware" };
  if (type === "Fashion" && /umbrella/.test(text)) return { parent: "garden-outdoor", child: null };
  if (type === "Massager" && /stove|gas saver/.test(text)) return { parent: "home-kitchen", child: null };
  if (type === "Light & Tourch" && /wash bag/.test(text)) return { parent: "fashion-bags", child: "Bags" };
  if (type === "All Products" && /fan/.test(text)) return { parent: "electronics-accessories", child: "Electronics" };
  if (type === "All Products") return { parent: "cleaning-household", child: "Cleaners" };
  if (!type.trim()) return { parent: "home-decor", child: null };
  const parent = typeParent[type] || "home-kitchen";
  if (directTypes.has(type)) return { parent, child: null };
  return { parent, child: childNames[type] || type };
}

function reserveSku(raw: string, handle: string, used: Set<string>): { sku: string; note: string | null } {
  const original = raw.trim();
  let base = original.slice(0, 40);
  let note: string | null = null;
  if (base.length < 2) {
    base = handle.slice(0, 40);
    note = "missing SKU, used the product handle";
  }
  if (!used.has(base) && (note || base === original)) {
    used.add(base);
    return { sku: base, note };
  }
  if (!used.has(base) && base !== original) {
    used.add(base);
    return { sku: base, note: "SKU shortened to 40 characters" };
  }
  const suffix = `-${handle.replace(/[^a-z0-9]/g, "").slice(0, 10) || "dup"}`;
  let candidate = `${base.slice(0, Math.max(2, 40 - suffix.length))}${suffix}`.slice(0, 40);
  let n = 2;
  while (used.has(candidate)) {
    const extra = `-${n}`;
    candidate = `${base.slice(0, Math.max(2, 40 - extra.length))}${extra}`.slice(0, 40);
    n += 1;
  }
  used.add(candidate);
  return { sku: candidate, note: note || `SKU ${original || "(blank)"} was already used, stored as ${candidate}` };
}

async function main() {
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  const header = rows[0];
  const index = Object.fromEntries(header.map((name, position) => [name, position]));
  const products = new Map<string, CsvProduct>();

  for (const record of rows.slice(1)) {
    const handle = (record[index.Handle] || "").trim();
    if (!handle) continue;
    let product = products.get(handle);
    if (!product) {
      product = { handle, title: "", body: "", type: "", status: "", published: "", variants: [], images: [] };
      products.set(handle, product);
    }
    if ((record[index.Title] || "").trim()) {
      product.title = record[index.Title].trim();
      product.body = record[index["Body (HTML)"]] || "";
      product.type = (record[index.Type] || "").trim();
      product.status = (record[index.Status] || "").trim();
      product.published = (record[index.Published] || "").trim();
    }
    const price = record[index["Variant Price"]] || "";
    const sku = record[index["Variant SKU"]] || "";
    if (price.trim() || sku.trim()) {
      const key = [record[index["Option1 Name"]], record[index["Option1 Value"]], record[index["Option2 Value"]], record[index["Option3 Value"]], sku, price].join("|");
      if (!product.variants.some((variant) => variant.optionName + variant.optionValue + variant.sku + variant.price === key.replace(/\|/g, ""))) {
        const signature = `${record[index["Option1 Name"]]}|${record[index["Option1 Value"]]}|${sku}|${price}`;
        if (!product.variants.some((variant) => `${variant.optionName}|${variant.optionValue}|${variant.sku}|${variant.price}` === signature)) {
          product.variants.push({
            optionName: record[index["Option1 Name"]] || "",
            optionValue: record[index["Option1 Value"]] || "",
            sku,
            price,
            compareAt: record[index["Variant Compare At Price"]] || "",
            qty: record[index["Variant Inventory Qty"]] || "",
            grams: record[index["Variant Grams"]] || "",
          });
        }
      }
    }
    const src = (record[index["Image Src"]] || "").trim();
    if (src && !product.images.some((image) => image.src === src)) {
      product.images.push({
        src,
        alt: (record[index["Image Alt Text"]] || "").trim(),
        position: Number(record[index["Image Position"]] || 999) || 999,
      });
    }
  }

  const parentIds = new Map<string, string>();
  for (const parent of parents) {
    const existing = await prisma.category.findUnique({ where: { slug: parent.slug } });
    if (existing) parentIds.set(parent.slug, existing.id);
    else {
      const created = await prisma.category.create({ data: parent });
      parentIds.set(parent.slug, created.id);
    }
  }

  const childIds = new Map<string, string>();
  async function categoryId(parentSlug: string, childName: string | null) {
    if (!childName) return parentIds.get(parentSlug)!;
    const key = `${parentSlug}:${childName}`;
    const cached = childIds.get(key);
    if (cached) return cached;
    const slug = `${parentSlug}-${slugify(childName)}`.slice(0, 80);
    const existing = await prisma.category.findUnique({ where: { slug } });
    const id = existing
      ? existing.id
      : (await prisma.category.create({
          data: {
            name: childName,
            slug,
            description: "",
            parentId: parentIds.get(parentSlug),
            sortOrder: 0,
          },
        })).id;
    childIds.set(key, id);
    return id;
  }

  const existingSlugs = new Set((await prisma.product.findMany({ select: { slug: true } })).map((product) => product.slug));
  const usedSkus = new Set([
    ...(await prisma.product.findMany({ select: { sku: true } })).map((product) => product.sku),
    ...(await prisma.variant.findMany({ select: { sku: true } })).map((variant) => variant.sku),
  ]);

  const skipped: string[] = [];
  const skuNotes: string[] = [];
  const priceNotes: string[] = [];
  const imageNotes: string[] = [];
  const variantNotes: string[] = [];
  let imported = 0;

  for (const product of products.values()) {
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.handle) ? product.handle : slugify(product.handle);
    if (!product.title || product.title.length < 2 || !slug) {
      skipped.push(`${product.handle || "(no handle)"}: missing title or slug`);
      continue;
    }
    if (existingSlugs.has(slug)) {
      skipped.push(`${product.title}: slug ${slug} already exists, left unchanged`);
      continue;
    }

    const priced = product.variants.filter((variant) => rupees(variant.price).amount != null && (rupees(variant.price).amount || 0) > 0);
    const source = priced[0] || product.variants[0];
    if (!source) {
      skipped.push(`${product.title}: no price`);
      continue;
    }
    const price = rupees(source.price);
    if (price.amount == null || price.amount <= 0) {
      skipped.push(`${product.title}: price "${source.price}" could not be stored`);
      continue;
    }
    if (price.fractional) priceNotes.push(`${product.title}: ${source.price} stored as ₹${price.amount}`);

    const compare = rupees(source.compareAt);
    let compareAtPrice: number | null = null;
    if (compare.amount != null && compare.amount > price.amount) compareAtPrice = compare.amount;
    else if (source.compareAt.trim() && compare.amount != null) priceNotes.push(`${product.title}: compare-at ₹${compare.amount} is not higher than ₹${price.amount}, so no discount was stored`);

    const qty = Number.parseInt(source.qty, 10);
    const stock = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const sku = reserveSku(source.sku, slug, usedSkus);
    if (sku.note) skuNotes.push(`${product.title}: ${sku.note}`);

    const distinctValues = [...new Set(priced.map((variant) => variant.optionValue.trim()).filter(Boolean))];
    const quantityOnly = priced.every((variant) => /^quantity$/i.test(variant.optionName.trim()) || variant.optionName.trim() === "");
    const realVariants = !quantityOnly && distinctValues.length > 1;
    if (realVariants) variantNotes.push(`${product.title}: ${distinctValues.length} options`);

    const descriptionSource = foldText(plain(product.body));
    const description = descriptionSource.length >= 10 ? descriptionSource : `${product.title}. ${product.type || "Supplier catalogue listing"}.`;
    const shortDescription = description.replace(/\s+/g, " ").slice(0, 220);
    const grams = Number.parseInt(source.grams, 10);
    const specs = [
      product.type ? { label: "Catalogue type", value: product.type } : null,
      Number.isFinite(grams) && grams > 0 ? { label: "Weight", value: `${grams} g` } : null,
    ].filter((spec): spec is { label: string; value: string } => Boolean(spec));

    const images = product.images.sort((a, b) => a.position - b.position).slice(0, 24).map((image, position) => ({
      url: image.src,
      alt: foldText(image.alt || product.title).slice(0, 300),
      sortOrder: position,
    }));
    if (images.length === 0) imageNotes.push(product.title);

    const placement = assign(product.title, product.type);
    const category = await categoryId(placement.parent, placement.child);
    const active = product.status.toLowerCase() === "active" && product.published.toLowerCase() === "true";

    const data = {
        name: foldText(product.title),
      slug,
      sku: sku.sku,
      description: description.slice(0, 30000),
      shortDescription,
      price: price.amount,
      compareAtPrice,
      stock,
      categoryId: category,
      specifications: JSON.stringify(specs),
      isActive: active,
      isFeatured: false,
      wholesaleEligible: false,
      images: images.length ? { create: images } : undefined,
    };
    try {
      await prisma.product.create({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const odd = [...data.description].flatMap((char, position) => {
        const code = char.charCodeAt(0);
        return code < 32 && code !== 10 && code !== 9 ? [`${position}:U+${code.toString(16)}`] : [];
      });
      console.error("SAVE FAILED", product.handle, product.title, message.split("\n")[0], "odd", odd.slice(0, 20).join(","), "len", data.description.length, "images", images.length);
      skipped.push(`${product.title}: could not be saved (${message.split("\n")[0]})`);
      continue;
    }
    existingSlugs.add(slug);
    imported += 1;
  }

  const categories = await prisma.category.findMany({ select: { id: true, image: true } });
  for (const category of categories) {
    if (category.image && !category.image.startsWith("/media/categories/")) continue;
    const sample = await prisma.product.findFirst({
      where: {
        images: { some: { url: { startsWith: "https://" } } },
        OR: [{ categoryId: category.id }, { category: { parentId: category.id } }],
      },
      orderBy: { name: "asc" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    const url = sample?.images[0]?.url;
    if (url) await prisma.category.update({ where: { id: category.id }, data: { image: url } });
  }

  const titles = new Map<string, number>();
  for (const product of products.values()) {
    const key = product.title.toLowerCase();
    titles.set(key, (titles.get(key) || 0) + 1);
  }
  const repeated = [...products.values()].filter((product) => (titles.get(product.title.toLowerCase()) || 0) > 1).map((product) => product.title);
  const uniqueRepeated = [...new Set(repeated)];

  const total = await prisma.product.count();
  const uncategorized = await prisma.product.count({ where: { categoryId: "" } });
  console.log(JSON.stringify({
    csvProducts: products.size,
    imported,
    totalProductsInDatabase: total,
    uncategorized,
    skipped,
    missingImages: imageNotes,
    skuAdjustments: skuNotes,
    priceNotes,
    variantProducts: variantNotes,
    repeatedTitlesKeptAsSeparateListings: uniqueRepeated,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
