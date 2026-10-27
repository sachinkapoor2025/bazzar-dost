import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categorySvg, markSvg, productSvg } from "../src/lib/art";

const prisma = new PrismaClient();

const categories = [
  ["home-kitchen", "Home & Kitchen", "Tools and containers for everyday cooking and storage.", 1],
  ["electronics-accessories", "Electronics & Accessories", "Small accessories for phones, desks, and charging.", 2],
  ["beauty-personal-care", "Beauty & Personal Care", "Simple personal-care products for daily use.", 3],
  ["fashion-bags", "Fashion & Bags", "Bags and wraps sized for regular use.", 4],
  ["toys-gifts", "Toys & Gifts", "Small gifts and playthings with plain materials.", 5],
  ["car-bike-accessories", "Car & Bike Accessories", "Compact accessories for cars and two-wheelers.", 6],
  ["lifestyle", "Lifestyle Products", "Home pieces for daily routines.", 7],
  ["office-stationery", "Office & Stationery", "Notebooks, pens, and desk storage.", 8],
] as const;

type VariantSeed = { name: string; sku: string; price: number; stock: number };
type ProductSeed = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  motif: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  short: string;
  description: string;
  specs: Array<[string, string]>;
  featured?: boolean;
  wholesale?: { moq: number; price?: number };
  variants?: VariantSeed[];
  minutesAgo: number;
};

const products: ProductSeed[] = [
  {
    slug: "seven-cup-masala-dabba",
    name: "Seven-Cup Masala Dabba",
    sku: "BD-HK-DABBA",
    category: "home-kitchen",
    motif: "spice",
    price: 749,
    compareAtPrice: 899,
    stock: 30,
    featured: true,
    wholesale: { moq: 12, price: 620 },
    minutesAgo: 400,
    short: "A round steel spice box with seven cups and a clear lid.",
    description: "A steel masala dabba for keeping everyday spices within reach. The seven cups sit under a see-through lid, and a small spoon fits in the centre.",
    specs: [["Material", "Stainless steel"], ["Cups", "7"], ["Care", "Hand wash"]],
  },
  {
    slug: "kitchen-towel-set",
    name: "Stonewashed Kitchen Towel Set",
    sku: "BD-HK-TOWEL",
    category: "home-kitchen",
    motif: "towel",
    price: 349,
    stock: 0,
    minutesAgo: 380,
    short: "Cotton kitchen towels sold as a two-pack or a four-pack.",
    description: "Absorbent cotton towels for drying hands and dishes. Choose a two-pack or a four-pack. The cloths are stonewashed so the colour looks slightly softened.",
    specs: [["Fabric", "Cotton"], ["Use", "Kitchen"], ["Care", "Machine wash cold"]],
    variants: [
      { name: "Pack of 2", sku: "BD-HK-TOWEL-2", price: 349, stock: 22 },
      { name: "Pack of 4", sku: "BD-HK-TOWEL-4", price: 599, stock: 14 },
    ],
  },
  {
    slug: "insulated-steel-bottle",
    name: "Insulated Steel Bottle",
    sku: "BD-HK-BOTTLE",
    category: "home-kitchen",
    motif: "bottle",
    price: 549,
    compareAtPrice: 649,
    stock: 0,
    featured: true,
    minutesAgo: 360,
    short: "A double-wall steel bottle in 750 ml or 1 litre.",
    description: "A steel bottle for water at a desk or in a bag. The 750 ml size is the lower price. The 1 litre size is priced separately and does not use the 750 ml compare-at price.",
    specs: [["Material", "Stainless steel"], ["Wall", "Double wall"], ["Lid", "Screw cap"]],
    variants: [
      { name: "750 ml", sku: "BD-HK-BOTTLE-750", price: 549, stock: 18 },
      { name: "1 litre", sku: "BD-HK-BOTTLE-1L", price: 699, stock: 11 },
    ],
  },
  {
    slug: "iron-dosa-tawa",
    name: "Iron Dosa Tawa 28 cm",
    sku: "BD-HK-TAWA",
    category: "home-kitchen",
    motif: "tawa",
    price: 899,
    stock: 14,
    minutesAgo: 340,
    short: "A flat iron tawa, 28 cm across, with a short handle.",
    description: "An iron tawa for dosa, chilla, and rotis. Season it with oil before the first use and dry it after washing so the surface stays even.",
    specs: [["Material", "Cast iron"], ["Diameter", "28 cm"], ["Handle", "Short helper handle"]],
  },
  {
    slug: "ceramic-jar-trio",
    name: "Ceramic Storage Jar Trio",
    sku: "BD-HK-JARS",
    category: "home-kitchen",
    motif: "jar",
    price: 799,
    stock: 16,
    wholesale: { moq: 8, price: 650 },
    minutesAgo: 320,
    short: "Three lidded ceramic jars for tea, sugar, or snacks.",
    description: "A set of three ceramic jars with fitted lids. They suit dry ingredients on an open shelf. The glaze is a warm off-white.",
    specs: [["Pieces", "3"], ["Material", "Ceramic"], ["Lid", "Fitted"]],
  },
  {
    slug: "braided-usb-c-cable",
    name: "Braided USB-C Cable 1.5 m",
    sku: "BD-EL-CABLE",
    category: "electronics-accessories",
    motif: "cable",
    price: 179,
    compareAtPrice: 249,
    stock: 42,
    minutesAgo: 300,
    short: "A 1.5 metre braided cable with USB-C connectors at both ends.",
    description: "A braided cable for charging phones, tablets, and earbuds that use USB-C. It is a charge-and-sync cable, not a wall charger.",
    specs: [["Length", "1.5 m"], ["Connectors", "USB-C to USB-C"], ["Cover", "Braided"]],
  },
  {
    slug: "clip-on-reading-lamp",
    name: "Clip-On Reading Lamp",
    sku: "BD-EL-LAMP",
    category: "electronics-accessories",
    motif: "lamp",
    price: 749,
    stock: 15,
    featured: true,
    minutesAgo: 280,
    short: "A rechargeable LED lamp that clips to a headboard or shelf.",
    description: "A small LED lamp with a clip and a tilt head. Charge it with the included USB-C cable. It has three brightness steps.",
    specs: [["Light", "LED"], ["Power", "Rechargeable battery"], ["Mount", "Clip"]],
  },
  {
    slug: "folding-phone-stand",
    name: "Folding Phone Stand",
    sku: "BD-EL-STAND",
    category: "electronics-accessories",
    motif: "stand",
    price: 229,
    stock: 28,
    minutesAgo: 260,
    short: "A fold-flat stand for phones in portrait or landscape.",
    description: "An aluminium stand that folds flat for a bag. It holds a phone for calls and videos. It does not charge the phone.",
    specs: [["Material", "Aluminium"], ["Folds flat", "Yes"], ["Use", "Desk"]],
  },
  {
    slug: "10000-mah-power-bank",
    name: "10,000 mAh Power Bank",
    sku: "BD-EL-BANK",
    category: "electronics-accessories",
    motif: "battery",
    price: 1199,
    stock: 12,
    minutesAgo: 240,
    short: "A compact 10,000 mAh power bank with USB-C input and output.",
    description: "A power bank for topping up a phone while travelling. Capacity is 10,000 mAh. A cable is not included.",
    specs: [["Capacity", "10,000 mAh"], ["Output", "USB-C"], ["Cable included", "No"]],
  },
  {
    slug: "neem-tulsi-face-cleanser",
    name: "Neem and Tulsi Face Cleanser",
    sku: "BD-BT-WASH",
    category: "beauty-personal-care",
    motif: "bottle",
    price: 169,
    stock: 36,
    minutesAgo: 220,
    short: "A 100 ml face cleanser with neem and tulsi.",
    description: "A daily face wash in a 100 ml bottle. The gel lathers with water and rinses off. Patch-test it if your skin is reactive.",
    specs: [["Size", "100 ml"], ["Form", "Gel"], ["Skin", "Patch-test first"]],
  },
  {
    slug: "coconut-hair-oil",
    name: "Cold-Pressed Coconut Hair Oil",
    sku: "BD-BT-OIL",
    category: "beauty-personal-care",
    motif: "drop",
    price: 239,
    compareAtPrice: 299,
    stock: 30,
    minutesAgo: 200,
    short: "A 200 ml bottle of cold-pressed coconut oil for hair.",
    description: "Coconut oil pressed for hair and scalp massage. The bottle holds 200 ml. It is a cosmetic oil, not a cooking ingredient.",
    specs: [["Size", "200 ml"], ["Process", "Cold-pressed"], ["Use", "Hair"]],
  },
  {
    slug: "bamboo-toothbrush-pack",
    name: "Bamboo Toothbrush Four Pack",
    sku: "BD-BT-BRUSH",
    category: "beauty-personal-care",
    motif: "brush",
    price: 149,
    stock: 40,
    minutesAgo: 180,
    short: "Four bamboo-handle toothbrushes with medium bristles.",
    description: "A pack of four toothbrushes with bamboo handles and medium nylon bristles. Replace a brush when the bristles splay.",
    specs: [["Pack", "4"], ["Bristles", "Medium nylon"], ["Handle", "Bamboo"]],
  },
  {
    slug: "shea-hand-cream",
    name: "Shea Hand Cream",
    sku: "BD-BT-CREAM",
    category: "beauty-personal-care",
    motif: "jar",
    price: 189,
    stock: 24,
    minutesAgo: 160,
    short: "A 50 ml unscented hand cream with shea butter.",
    description: "A small jar of unscented hand cream. The 50 ml size fits a desk drawer. Use it on hands, not on broken skin.",
    specs: [["Size", "50 ml"], ["Scent", "Unscented"], ["Base", "Shea butter"]],
  },
  {
    slug: "market-cotton-tote",
    name: "Market Cotton Tote",
    sku: "BD-FA-TOTE",
    category: "fashion-bags",
    motif: "tote",
    price: 399,
    stock: 32,
    featured: true,
    wholesale: { moq: 24, price: 275 },
    minutesAgo: 150,
    short: "A sturdy cotton tote with two long handles.",
    description: "A cotton tote for groceries, books, or a laptop sleeve. The handles sit on the shoulder. It is unlined and unbranded apart from the weave.",
    specs: [["Fabric", "Cotton canvas"], ["Handles", "Two"], ["Closure", "Open top"]],
  },
  {
    slug: "handloom-cotton-stole",
    name: "Handloom Cotton Stole",
    sku: "BD-FA-STOLE",
    category: "fashion-bags",
    motif: "stole",
    price: 649,
    compareAtPrice: 799,
    stock: 12,
    minutesAgo: 140,
    short: "A light cotton stole in an undyed ecru weave.",
    description: "A handloom cotton stole for sun or air-conditioning. The colour is undyed ecru. The edges are finished with a short fringe.",
    specs: [["Fabric", "Cotton"], ["Weave", "Handloom"], ["Colour", "Ecru"]],
  },
  {
    slug: "everyday-sling-pouch",
    name: "Everyday Sling Pouch",
    sku: "BD-FA-SLING",
    category: "fashion-bags",
    motif: "sling",
    price: 749,
    stock: 18,
    minutesAgo: 130,
    short: "A compact sling with a zip and an adjustable strap.",
    description: "A small sling for a phone, keys, and a slim wallet. The strap adjusts. It is not large enough for a water bottle.",
    specs: [["Closure", "Zip"], ["Strap", "Adjustable"], ["Style", "Sling"]],
  },
  {
    slug: "wooden-stacking-rings",
    name: "Wooden Stacking Rings",
    sku: "BD-TY-RINGS",
    category: "toys-gifts",
    motif: "rings",
    price: 429,
    stock: 15,
    featured: true,
    minutesAgo: 120,
    short: "Five smooth wooden rings on a central post.",
    description: "A wooden stacking toy with five rings and a post. The pieces are sanded smooth and finished with a plant-based oil. Small parts are not suitable for children under 3.",
    specs: [["Material", "Wood"], ["Rings", "5"], ["Age", "3 years and older"]],
  },
  {
    slug: "beeswax-crayon-tin",
    name: "Beeswax Crayon Tin",
    sku: "BD-TY-CRAYON",
    category: "toys-gifts",
    motif: "crayons",
    price: 189,
    stock: 26,
    minutesAgo: 110,
    short: "Eight chunky beeswax crayons in a metal tin.",
    description: "A tin of eight thick crayons made with beeswax. The shape is easy to grip. Colours are mixed in small batches, so the shade can vary slightly.",
    specs: [["Pieces", "8"], ["Wax", "Beeswax"], ["Case", "Metal tin"]],
  },
  {
    slug: "twenty-four-piece-puzzle",
    name: "24-Piece Picture Puzzle",
    sku: "BD-TY-PUZZLE",
    category: "toys-gifts",
    motif: "puzzle",
    price: 279,
    stock: 20,
    minutesAgo: 90,
    short: "A 24-piece puzzle of a market street, packed in a box.",
    description: "A cardboard puzzle with 24 large pieces. The picture shows a painted market street made for this catalogue, not a photograph of a real shop.",
    specs: [["Pieces", "24"], ["Material", "Cardboard"], ["Age", "4 years and older"]],
  },
  {
    slug: "dashboard-phone-mount",
    name: "Dashboard Phone Mount",
    sku: "BD-AU-MOUNT",
    category: "car-bike-accessories",
    motif: "mount",
    price: 329,
    stock: 19,
    minutesAgo: 80,
    short: "A dashboard mount with a sticky pad and a cradle.",
    description: "A phone cradle that sticks to a flat dashboard. Clean the surface before fitting it. It does not attach to air vents.",
    specs: [["Mount", "Adhesive pad"], ["Grip", "Side arms"], ["Fits", "Phones up to 85 mm wide"]],
  },
  {
    slug: "microfiber-cloth-pack",
    name: "Microfiber Cloth Three Pack",
    sku: "BD-AU-CLOTH",
    category: "car-bike-accessories",
    motif: "cloth",
    price: 159,
    stock: 44,
    minutesAgo: 70,
    short: "Three microfiber cloths for dust on screens and bodywork.",
    description: "A pack of three lint-holding cloths for dashboards, helmets, and mirrors. Wash them without fabric softener.",
    specs: [["Pack", "3"], ["Fabric", "Microfiber"], ["Use", "Dry dusting"]],
  },
  {
    slug: "vent-clip-freshener",
    name: "Vent Clip Freshener",
    sku: "BD-AU-FRESH",
    category: "car-bike-accessories",
    motif: "freshener",
    price: 129,
    stock: 38,
    minutesAgo: 60,
    short: "A single vent clip with a mild citrus scent.",
    description: "A plastic clip for a car air vent. The scent is citrus and lasts until the pad dries out. Keep it away from children and pets.",
    specs: [["Scent", "Citrus"], ["Fit", "Standard vent fin"], ["Pack", "1"]],
  },
  {
    slug: "unscented-soy-candle",
    name: "Unscented Soy Candle",
    sku: "BD-LF-CANDLE",
    category: "lifestyle",
    motif: "candle",
    price: 379,
    compareAtPrice: 449,
    stock: 20,
    featured: true,
    minutesAgo: 50,
    short: "An unscented soy candle in a reusable glass.",
    description: "A soy wax candle without added fragrance. Burn it on a stable surface and keep the wick trimmed to about 5 mm. Do not leave it unattended.",
    specs: [["Wax", "Soy"], ["Scent", "None"], ["Vessel", "Glass"]],
  },
  {
    slug: "speckle-mug-pair",
    name: "Speckle Glaze Mug Pair",
    sku: "BD-LF-MUG",
    category: "lifestyle",
    motif: "mug",
    price: 529,
    stock: 14,
    minutesAgo: 40,
    short: "Two stoneware mugs with a cream speckle glaze.",
    description: "A pair of stoneware mugs. Each holds about 250 ml. They are dishwasher safe and microwave safe.",
    specs: [["Pieces", "2"], ["Capacity", "About 250 ml"], ["Material", "Stoneware"]],
  },
  {
    slug: "cushion-cover",
    name: "Cotton Cushion Cover",
    sku: "BD-LF-CUSHION",
    category: "lifestyle",
    motif: "cushion",
    price: 459,
    stock: 16,
    wholesale: { moq: 20, price: 340 },
    minutesAgo: 30,
    short: "A 16-inch cotton cushion cover with a hidden zip.",
    description: "A square cotton cover for a 16-inch cushion insert. The insert is not included. The zip is hidden along one edge.",
    specs: [["Size", "16 inch"], ["Insert", "Not included"], ["Closure", "Hidden zip"]],
  },
  {
    slug: "a5-notebook-pack",
    name: "A5 Ruled Notebook Three Pack",
    sku: "BD-OF-NOTES",
    category: "office-stationery",
    motif: "notebook",
    price: 219,
    stock: 40,
    minutesAgo: 20,
    short: "Three A5 notebooks with ruled paper and a stitched spine.",
    description: "A pack of three soft-cover notebooks. The paper is ruled and suitable for pen. Each book has 80 pages.",
    specs: [["Size", "A5"], ["Pack", "3"], ["Pages", "80 each"]],
  },
  {
    slug: "desk-tray-organiser",
    name: "Desk Tray Organiser",
    sku: "BD-OF-TRAY",
    category: "office-stationery",
    motif: "tray",
    price: 579,
    stock: 11,
    wholesale: { moq: 10, price: 460 },
    minutesAgo: 15,
    short: "A four-section tray for paper, clips, and pens.",
    description: "A desk tray with four sections. It holds loose paper, clips, and a few pens. The material is powder-coated steel.",
    specs: [["Sections", "4"], ["Material", "Steel"], ["Use", "Desk"]],
  },
  {
    slug: "gel-pen-pack",
    name: "Gel Pen Six Pack",
    sku: "BD-OF-PENS",
    category: "office-stationery",
    motif: "pen",
    price: 99,
    stock: 55,
    minutesAgo: 8,
    short: "Six black 0.5 mm gel pens.",
    description: "A pack of six black gel pens with a 0.5 mm tip. The ink is water-based. Caps should be replaced so the tips do not dry.",
    specs: [["Pack", "6"], ["Tip", "0.5 mm"], ["Ink", "Black gel"]],
  },
  {
    slug: "kraft-envelope-pack",
    name: "Kraft Envelope Pack",
    sku: "BD-OF-ENV",
    category: "office-stationery",
    motif: "envelope",
    price: 139,
    stock: 48,
    minutesAgo: 4,
    short: "Twenty-five A5 kraft envelopes with a self-seal strip.",
    description: "A pack of 25 brown kraft envelopes sized for an A5 card. The flap has a self-seal strip. They are not padded.",
    specs: [["Pack", "25"], ["Size", "A5"], ["Seal", "Self-seal"]],
  },
];

function writeArt() {
  const productsDir = path.join(process.cwd(), "public", "media", "products");
  const categoriesDir = path.join(process.cwd(), "public", "media", "categories");
  fs.mkdirSync(productsDir, { recursive: true });
  fs.mkdirSync(categoriesDir, { recursive: true });
  for (const category of categories) {
    fs.writeFileSync(path.join(categoriesDir, `${category[0]}.svg`), categorySvg(category[1]));
  }
  for (const product of products) {
    fs.writeFileSync(path.join(productsDir, `${product.slug}.svg`), productSvg(product.name, product.motif));
  }
  fs.writeFileSync(path.join(process.cwd(), "src", "app", "icon.svg"), markSvg());
}

async function seedCatalog() {
  writeArt();
  const categoryIds = new Map<string, string>();
  for (const [slug, name, description, sortOrder] of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name, description, sortOrder, image: `/media/categories/${slug}.svg` },
    });
    categoryIds.set(slug, category.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) continue;
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        shortDescription: product.short,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        stock: product.variants ? 0 : product.stock,
        categoryId,
        specifications: JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
        isActive: true,
        isFeatured: Boolean(product.featured),
        wholesaleEligible: Boolean(product.wholesale),
        minOrderQty: product.wholesale?.moq ?? null,
        wholesalePrice: product.wholesale?.price ?? null,
        createdAt: new Date(Date.now() - product.minutesAgo * 60 * 1000),
        images: {
          create: [{ url: `/media/products/${product.slug}.svg`, alt: product.name, sortOrder: 0 }],
        },
        variants: product.variants
          ? { create: product.variants.map((variant) => ({ ...variant, image: "" })) }
          : undefined,
      },
    });
  }
}

async function main() {
  if ((await prisma.product.count()) === 0) {
    await seedCatalog();
    console.log(`Seeded ${products.length} starter products.`);
  } else {
    console.log("Products already exist. Starter catalogue was left unchanged.");
  }

  if ((await prisma.promotion.count()) === 0) {
    await prisma.promotion.create({
      data: {
        title: "Shipping at checkout",
        message: "Shipping is ₹49, and free when the payable product total reaches ₹999.",
        href: "/shipping-policy",
        kind: "announcement",
        active: true,
      },
    });
  }

  if ((await prisma.coupon.count()) === 0) {
    await prisma.coupon.create({
      data: {
        code: "WELCOME50",
        type: "FIXED",
        value: 50,
        minSubtotal: 499,
        active: true,
        note: "Starter coupon. Disable it in admin if you do not want to offer it.",
      },
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 8) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: "Store admin",
          phone: "",
          role: "admin",
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      console.log(`Created admin ${email}`);
    } else {
      console.log(`Admin ${email} already exists.`);
    }
  } else {
    console.log("ADMIN_EMAIL and ADMIN_PASSWORD were not set, so no admin was created.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
