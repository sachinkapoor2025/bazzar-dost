import fs from "node:fs";

const csvPath = process.argv[2] || "C:/Users/dell/Downloads/shopify-products (5).csv";
const outPath = new URL("../src/data/shopify-catalogue.json", import.meta.url);

const parents = [
  ["home-kitchen", "Home & Kitchen", "Tools and containers for everyday cooking and storage.", 1],
  ["electronics-accessories", "Electronics & Accessories", "Small accessories for phones, desks, and charging.", 2],
  ["beauty-personal-care", "Beauty & Personal Care", "Simple personal-care products for daily use.", 3],
  ["fashion-bags", "Fashion & Bags", "Bags and wraps sized for regular use.", 4],
  ["toys-gifts", "Toys & Gifts", "Small gifts and playthings with plain materials.", 5],
  ["car-bike-accessories", "Car & Bike Accessories", "Compact accessories for cars and two-wheelers.", 6],
  ["lifestyle", "Lifestyle Products", "Home pieces for daily routines.", 7],
  ["office-stationery", "Office & Stationery", "Notebooks, pens, and desk storage.", 8],
  ["home-decor", "Home Decor", "Wall coverings, clocks, and decorative pieces from the supplier catalogue.", 9],
  ["garden-outdoor", "Garden & Outdoor", "Garden and outdoor items from the supplier catalogue.", 10],
  ["tools-hardware", "Tools & Hardware", "Hardware and hand tools from the supplier catalogue.", 11],
  ["health-fitness", "Health & Fitness", "Massagers, exercise items, and scales from the supplier catalogue.", 12],
  ["pet-supplies", "Pet Supplies", "Pet supplies from the supplier catalogue.", 13],
  ["cleaning-household", "Cleaning & Household", "Cleaners and household cleaning tools from the supplier catalogue.", 14],
  ["safety-products", "Safety Products", "Safety products from the supplier catalogue.", 15],
];

const typeParent = {
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

const childNames = {
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

function parseCsv(csv) {
  const rows = [];
  let row = [];
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

function foldText(value) {
  return [...value].map((char) => {
    const code = char.codePointAt(0) || 0;
    const ranges = [
      [0x1d400, 0x1d419, 0x41],
      [0x1d41a, 0x1d433, 0x61],
      [0x1d434, 0x1d44d, 0x41],
      [0x1d44e, 0x1d467, 0x61],
      [0x1d468, 0x1d481, 0x41],
      [0x1d482, 0x1d49b, 0x61],
      [0x1d538, 0x1d551, 0x41],
      [0x1d552, 0x1d56b, 0x61],
      [0x1d5a0, 0x1d5b9, 0x41],
      [0x1d5ba, 0x1d5d3, 0x61],
      [0x1d5d4, 0x1d5ed, 0x41],
      [0x1d5ee, 0x1d607, 0x61],
      [0x1d608, 0x1d621, 0x41],
      [0x1d622, 0x1d63b, 0x61],
      [0x1d63c, 0x1d655, 0x41],
      [0x1d656, 0x1d66f, 0x61],
      [0x1d670, 0x1d689, 0x41],
      [0x1d68a, 0x1d6a3, 0x61],
    ];
    for (const [start, end, base] of ranges) {
      if (code >= start && code <= end) return String.fromCharCode(base + code - start);
    }
    return code > 0xffff ? "" : char;
  }).join("");
}

function plain(html) {
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
    .replace(/^Attribute Value\s+/i, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function rupees(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function assign(title, type) {
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

function reserveSku(raw, handle, used) {
  let base = raw.trim().slice(0, 40);
  if (base.length < 2) base = handle.slice(0, 40);
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    const extra = `-${n}`;
    candidate = `${base.slice(0, Math.max(2, 40 - extra.length))}${extra}`.slice(0, 40);
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

const text = fs.readFileSync(csvPath, "utf8");
const rows = parseCsv(text);
const header = rows[0];
const index = Object.fromEntries(header.map((name, position) => [name, position]));
const products = new Map();

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
    const signature = `${record[index["Option1 Name"]]}|${record[index["Option1 Value"]]}|${sku}|${price}`;
    if (!product.variants.some((variant) => `${variant.optionName}|${variant.optionValue}|${variant.sku}|${variant.price}` === signature)) {
      product.variants.push({
        optionName: record[index["Option1 Name"]] || "",
        optionValue: record[index["Option1 Value"]] || "",
        sku,
        price,
        compareAt: record[index["Variant Compare At Price"]] || "",
        qty: record[index["Variant Inventory Qty"]] || "",
      });
    }
  }
  const src = (record[index["Image Src"]] || "").trim();
  if (src.startsWith("https://cdn.shopify.com/") && !product.images.some((image) => image.src === src)) {
    product.images.push({
      src,
      alt: (record[index["Image Alt Text"]] || "").trim(),
      position: Number(record[index["Image Position"]] || 999) || 999,
    });
  }
}

const starterSource = fs.readFileSync(new URL("../apps/api/src/starter-catalog.ts", import.meta.url), "utf8");
const starterSlugs = new Set([...starterSource.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]));
const usedSkus = new Set([...starterSource.matchAll(/sku: "([^"]+)"/g)].map((match) => match[1]));
const catalogue = [];
let skipped = 0;

for (const product of products.values()) {
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.handle) ? product.handle : slugify(product.handle);
  const active = product.status.toLowerCase() === "active" && product.published.toLowerCase() === "true";
  if (!product.title || product.title.length < 2 || !slug || !active || starterSlugs.has(slug)) {
    skipped += 1;
    continue;
  }
  const priced = product.variants.filter((variant) => (rupees(variant.price) || 0) > 0);
  const source = priced[0] || product.variants[0];
  const price = source ? rupees(source.price) : null;
  if (price == null || price <= 0) {
    skipped += 1;
    continue;
  }
  const compareAmount = source ? rupees(source.compareAt) : null;
  const compareAtPrice = compareAmount != null && compareAmount > price ? compareAmount : null;
  const qty = Number.parseInt(source.qty, 10);
  const stock = Number.isFinite(qty) && qty > 0 ? qty : 0;
  const distinctValues = [...new Set(priced.map((variant) => variant.optionValue.trim()).filter(Boolean))];
  const quantityOnly = priced.every((variant) => /^quantity$/i.test(variant.optionName.trim()) || variant.optionName.trim() === "");
  const realVariants = !quantityOnly && distinctValues.length > 1;
  const descriptionSource = foldText(plain(product.body));
  const description = (descriptionSource.length >= 10 ? descriptionSource : `${foldText(product.title)}. ${product.type || "Supplier catalogue listing"}.`).slice(0, 8000);
  const images = product.images
    .sort((a, b) => a.position - b.position)
    .slice(0, 8)
    .map((image) => ({ url: image.src, alt: foldText(image.alt || product.title).slice(0, 300) || foldText(product.title) }));
  const placement = assign(product.title, product.type);
  const variants = realVariants
    ? priced.map((variant) => {
        const variantPrice = rupees(variant.price);
        const variantQty = Number.parseInt(variant.qty, 10);
        return {
          name: variant.optionValue.trim().slice(0, 80),
          sku: reserveSku(variant.sku, `${slug}-${slugify(variant.optionValue)}`, usedSkus),
          price: variantPrice,
          stock: Number.isFinite(variantQty) && variantQty > 0 ? variantQty : 0,
        };
      })
    : [];
  catalogue.push({
    slug,
    name: foldText(product.title).slice(0, 160),
    sku: reserveSku(source.sku, slug, usedSkus),
    description,
    shortDescription: description.replace(/\s+/g, " ").slice(0, 220),
    price,
    compareAtPrice,
    stock: variants.length ? 0 : stock,
    categorySlug: placement.child ? `${placement.parent}-${slugify(placement.child)}`.slice(0, 80) : placement.parent,
    parentSlug: placement.parent,
    childName: placement.child,
    specifications: [
      product.type ? ["Catalogue type", product.type] : null,
    ].filter(Boolean),
    images,
    variants,
  });
}

const parentBySlug = new Map(parents.map(([slug, name, description, sortOrder]) => [slug, { slug, name, description, sortOrder, parentSlug: null }]));
const categories = new Map();
for (const product of catalogue) {
  const image = product.images[0]?.url || "";
  if (!categories.has(product.parentSlug)) {
    const parent = parentBySlug.get(product.parentSlug);
    categories.set(product.parentSlug, { ...parent, image });
  } else if (!categories.get(product.parentSlug).image && image) {
    categories.get(product.parentSlug).image = image;
  }
  if (product.childName && !categories.has(product.categorySlug)) {
    categories.set(product.categorySlug, {
      slug: product.categorySlug,
      name: product.childName,
      description: "",
      sortOrder: 0,
      parentSlug: product.parentSlug,
      image,
    });
  }
}

const output = {
  categories: [...categories.values()],
  products: catalogue.map(({ childName, parentSlug, ...product }) => product),
};

fs.mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(JSON.stringify({
  csvProducts: products.size,
  added: catalogue.length,
  skipped,
  categories: categories.size,
  withImages: catalogue.filter((product) => product.images.length > 0).length,
  withVariants: catalogue.filter((product) => product.variants.length > 0).length,
}, null, 2));
