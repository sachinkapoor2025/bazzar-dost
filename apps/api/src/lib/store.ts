import crypto from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import { categories as starterCategories, products as starterProducts } from "../starter-catalog";
import { boughtTogether, categoryDetail, categoryLinks, queryCatalog, relatedProducts, salesByProduct, toCard, type CatalogInput } from "./catalog-query";
import { couponDiscount, MAX_LINE_QTY, orderTotal, sellingPrice, shippingCharge } from "./commerce";
import { cartsTable, configTable, customersTable, eventsTable, nowIso, ordersTable, productsTable, ttlInDays } from "./db";
import { deleteItem, getItem, isConflict, putItem, queryIndex, queryPk, scanTable, type Item } from "./tables";
import type { Address, Category, Coupon, HydratedProduct, Inquiry, Order, OrderItem, Product, Promotion, PublicUser, Review } from "./types";
import { reviewDecision, reviewSummary } from "../../../src/lib/product-reviews";

export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type UserRecord = PublicUser & { passwordHash: string; createdAt: string; updatedAt: string };

let queue: Promise<unknown> = Promise.resolve();

function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function asProduct(item: Item): Product {
  return item as unknown as Product;
}

function asCategory(item: Item): Category {
  return item as unknown as Category;
}

function hydrate(product: Product, categories: Category[]): HydratedProduct {
  const category = categories.find((item) => item.id === product.categoryId);
  const parent = category?.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
  return {
    ...product,
    category: {
      id: category?.id ?? product.categoryId,
      name: category?.name ?? "Catalogue",
      slug: category?.slug ?? "shop",
      parent: parent ? { name: parent.name, slug: parent.slug } : null,
    },
  };
}

async function writeProduct(product: Product, expectedVersion?: number): Promise<void> {
  await putItem(
    productsTable(),
    {
      PK: `PRODUCT#${product.id}`,
      SK: "META",
      GSI1PK: "PRODUCT",
      GSI1SK: `${product.name.toLowerCase()}#${product.id}`,
      entityType: "product",
      ...product,
    },
    expectedVersion,
  );
}

async function writeCategory(category: Category): Promise<void> {
  await putItem(productsTable(), {
    PK: `CATEGORY#${category.id}`,
    SK: "META",
    GSI1PK: "CATEGORY",
    GSI1SK: `${String(category.sortOrder).padStart(6, "0")}#${category.slug}`,
    entityType: "category",
    ...category,
  });
}

function lockPk(kind: "SLUG" | "SKU", value: string): string {
  return `${kind}#${kind === "SLUG" ? value.toLowerCase() : value}`;
}

async function claim(kind: "SLUG" | "SKU", value: string, ownerId: string): Promise<void> {
  const pk = lockPk(kind, value);
  const existing = await getItem(productsTable(), pk, "LOCK");
  if (existing && existing.ownerId !== ownerId) throw new StoreError("That slug or SKU is already used.");
  await putItem(productsTable(), { PK: pk, SK: "LOCK", ownerId });
}

async function release(kind: "SLUG" | "SKU", value: string, ownerId: string): Promise<void> {
  const pk = lockPk(kind, value);
  const existing = await getItem(productsTable(), pk, "LOCK");
  if (existing?.ownerId === ownerId) await deleteItem(productsTable(), pk, "LOCK");
}

export async function listProducts(): Promise<Product[]> {
  const items = await queryIndex(productsTable(), "GSI1", "PRODUCT");
  return items.filter((item) => item.entityType === "product").map(asProduct);
}

export async function listCategories(): Promise<Category[]> {
  const items = await queryIndex(productsTable(), "GSI1", "CATEGORY");
  return items
    .filter((item) => item.entityType === "category")
    .map(asCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getProduct(productId: string): Promise<Product | null> {
  const item = await getItem(productsTable(), `PRODUCT#${productId}`, "META");
  return item ? asProduct(item) : null;
}

async function loadOrders(): Promise<Order[]> {
  const items = await scanTable(ordersTable());
  return items.filter((item) => item.entityType === "order").map((item) => item as unknown as Order);
}

export async function listAllOrders(): Promise<Order[]> {
  return (await loadOrders()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

async function catalog() {
  const [products, categories, orders] = await Promise.all([listProducts(), listCategories(), loadOrders()]);
  const hydrated = products.map((product) => hydrate(product, categories));
  return { products, categories, orders, hydrated, sales: salesByProduct(orders) };
}

function publicProduct(product: HydratedProduct) {
  return product;
}

export async function getProductBySlug(slug: string) {
  const { hydrated } = await catalog();
  return hydrated.find((product) => product.slug === slug && product.isActive) ?? null;
}

export async function getProductRecord(productId: string) {
  const { hydrated } = await catalog();
  return hydrated.find((product) => product.id === productId) ?? null;
}

export async function homeData() {
  const data = await catalog();
  const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const active = data.hydrated.filter((product) => product.isActive);
  const featured = active.filter((product) => product.isFeatured).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8).map(toCard);
  const arrivals = active.filter((product) => Date.parse(product.createdAt) >= since).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8).map(toCard);
  const trending = active.filter((product) => product.viewCount > 0).sort((a, b) => b.viewCount - a.viewCount).slice(0, 8).map(toCard);
  const priced = active.filter((product) => product.price <= 999).sort((a, b) => a.price - b.price).map(toCard);
  const deals = active
    .filter((product) => product.compareAtPrice != null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toCard)
    .filter((card) => card.compareAtPrice != null && card.compareAtPrice > card.price && !card.fromPrice)
    .slice(0, 8);
  const best = queryCatalog(data.hydrated, data.categories, data.sales, { bestSellersOnly: true, page: 1 });
  const coupons = (await listCoupons()).filter((coupon) => coupon.active && (!coupon.expiresAt || Date.parse(coupon.expiresAt) >= Date.now()));
  return {
    categories: categoryLinks(data.categories, data.hydrated, "top"),
    featured,
    arrivals,
    trending,
    deals,
    bestSellers: best.items.slice(0, 8),
    budget: {
      under199: priced.filter((product) => product.price <= 199).slice(0, 4),
      from200to499: priced.filter((product) => product.price >= 200 && product.price <= 499).slice(0, 4),
      from500to999: priced.filter((product) => product.price >= 500 && product.price <= 999).slice(0, 4),
    },
    announcement: await currentAnnouncement(),
    coupons,
    productCount: active.length,
  };
}

export async function searchCatalog(input: CatalogInput) {
  const data = await catalog();
  return queryCatalog(data.hydrated, data.categories, data.sales, input);
}

export async function categoriesFor(scope: "top" | "all") {
  const data = await catalog();
  return categoryLinks(data.categories, data.hydrated, scope);
}

export async function categoryBySlug(slug: string) {
  const data = await catalog();
  return categoryDetail(slug, data.categories, data.hydrated);
}

export async function cardsFor(kind: "featured" | "arrivals" | "trending" | "wholesale", take: number) {
  const data = await catalog();
  if (kind === "wholesale") {
    return data.hydrated
      .filter((product) => product.isActive && product.wholesaleEligible)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, take)
      .map(toCard);
  }
  return [];
}

export async function relatedFor(categoryId: string, productId: string) {
  const data = await catalog();
  return relatedProducts(categoryId, productId, data.categories, data.hydrated);
}

export async function togetherFor(productId: string) {
  const data = await catalog();
  return boughtTogether(productId, data.orders, data.hydrated);
}

export async function productsByIds(ids: string[]) {
  const data = await catalog();
  const unique = [...new Set(ids)].slice(0, 50);
  return unique.flatMap((productId) => {
    const product = data.hydrated.find((item) => item.id === productId && item.isActive);
    return product ? [toCard(product)] : [];
  });
}

export async function productsBySlugs(slugs: string[]) {
  const data = await catalog();
  const unique = [...new Set(slugs)].slice(0, 12);
  return unique.flatMap((slug) => {
    const product = data.hydrated.find((item) => item.slug === slug && item.isActive);
    return product ? [toCard(product)] : [];
  });
}

export async function recordView(slug: string): Promise<void> {
  const { hydrated } = await catalog();
  const product = hydrated.find((item) => item.slug === slug && item.isActive);
  if (!product) return;
  const next = { ...product, viewCount: product.viewCount + 1, version: product.version + 1, updatedAt: nowIso() };
  try {
    await writeProduct(next, product.version);
  } catch (error) {
    if (!isConflict(error)) throw error;
  }
  await putItem(eventsTable(), {
    PK: `PRODUCT#${product.id}`,
    SK: `VIEW#${nowIso()}#${crypto.randomBytes(4).toString("hex")}`,
    entityType: "view",
    productId: product.id,
    expiresAt: ttlInDays(30),
  });
}

export async function sitemapData() {
  const data = await catalog();
  const active = data.hydrated.filter((product) => product.isActive);
  const categories = data.categories.filter((category) => {
    const own = active.some((product) => product.categoryId === category.id);
    const child = data.categories.some((item) => item.parentId === category.id && active.some((product) => product.categoryId === item.id));
    return own || child;
  });
  return {
    products: active.map((product) => ({ slug: product.slug, updatedAt: product.updatedAt })),
    categories: categories.map((category) => ({ slug: category.slug })),
  };
}

export async function catalogueRows() {
  const data = await catalog();
  return data.hydrated
    .filter((product) => product.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => ({
      name: product.name,
      sku: product.sku,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      slug: product.slug,
      category: { name: product.category.name },
    }));
}

async function writeUser(user: UserRecord): Promise<void> {
  await putItem(customersTable(), {
    PK: `USER#${user.id}`,
    SK: "META",
    GSI1PK: `EMAIL#${user.email}`,
    GSI1SK: "USER",
    entityType: "user",
    ...user,
  });
}

function toPublic(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
}

export async function getUser(userId: string): Promise<UserRecord | null> {
  const item = await getItem(customersTable(), `USER#${userId}`, "META");
  return item ? (item as unknown as UserRecord) : null;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const items = await queryIndex(customersTable(), "GSI1", `EMAIL#${email.toLowerCase()}`);
  const item = items.find((entry) => entry.entityType === "user");
  return item ? (item as unknown as UserRecord) : null;
}

export async function registerUser(input: { email: string; name: string; phone: string; password: string }): Promise<PublicUser> {
  const email = input.email.toLowerCase();
  if (await getUserByEmail(email)) throw new StoreError("An account with this email already exists.");
  const user: UserRecord = {
    id: id("usr"),
    email,
    name: input.name,
    phone: input.phone,
    role: "customer",
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await writeUser(user);
  return toPublic(user);
}

export async function loginUser(email: string, password: string): Promise<PublicUser> {
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new StoreError("Email or password is not correct.", 401);
  }
  return toPublic(user);
}

export async function updateProfile(userId: string, input: { name: string; phone: string }): Promise<void> {
  const user = await getUser(userId);
  if (!user) throw new StoreError("Sign in required.", 401);
  user.name = input.name;
  user.phone = input.phone;
  user.updatedAt = nowIso();
  await writeUser(user);
}

export async function createResetToken(email: string, tokenHash: string, expiresAt: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user) return false;
  await putItem(customersTable(), { PK: `RESET#${tokenHash}`, SK: "META", entityType: "reset", userId: user.id, expiresAt });
  return true;
}

export async function resetPassword(tokenHash: string, password: string): Promise<void> {
  const record = await getItem(customersTable(), `RESET#${tokenHash}`, "META");
  if (!record || Date.parse(String(record.expiresAt)) < Date.now()) throw new StoreError("This reset link is not valid.");
  const user = await getUser(String(record.userId));
  if (!user) throw new StoreError("This reset link is not valid.");
  user.passwordHash = await bcrypt.hash(password, 12);
  user.updatedAt = nowIso();
  await writeUser(user);
  const items = await scanTable(customersTable());
  for (const item of items) {
    if (String(item.PK).startsWith("RESET#") && item.userId === user.id) await deleteItem(customersTable(), item.PK, item.SK);
  }
}

function addressFrom(item: Item): Address {
  return item as unknown as Address;
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const items = await queryPk(customersTable(), `USER#${userId}`);
  return items
    .filter((item) => item.entityType === "address")
    .map(addressFrom)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id.localeCompare(b.id));
}

async function writeAddress(address: Address): Promise<void> {
  await putItem(customersTable(), { PK: `USER#${address.userId}`, SK: `ADDRESS#${address.id}`, entityType: "address", ...address });
}

export async function addAddress(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address[]> {
  if (input.isDefault) {
    for (const address of await listAddresses(userId)) {
      if (address.isDefault) await writeAddress({ ...address, isDefault: false });
    }
  }
  await writeAddress({ ...input, id: id("addr"), userId });
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, addressId: string): Promise<Address[]> {
  const items = await listAddresses(userId);
  if (!items.some((address) => address.id === addressId)) throw new StoreError("Address not found.", 404);
  await deleteItem(customersTable(), `USER#${userId}`, `ADDRESS#${addressId}`);
  return listAddresses(userId);
}

export async function listWishlist(userId: string): Promise<string[]> {
  const items = await queryPk(customersTable(), `USER#${userId}`);
  return items.filter((item) => item.entityType === "wish").map((item) => String(item.productId));
}

export async function toggleWishlist(userId: string, productId: string): Promise<{ saved: boolean }> {
  const product = await getProduct(productId);
  if (!product || !product.isActive) throw new StoreError("That product is not available.", 404);
  const sk = `WISH#${productId}`;
  const existing = await getItem(customersTable(), `USER#${userId}`, sk);
  if (existing) {
    await deleteItem(customersTable(), `USER#${userId}`, sk);
    return { saved: false };
  }
  await putItem(customersTable(), { PK: `USER#${userId}`, SK: sk, entityType: "wish", productId, createdAt: nowIso() });
  return { saved: true };
}

export async function syncWishlist(userId: string, productIds: string[]): Promise<string[]> {
  for (const productId of productIds.slice(0, 50)) {
    const product = await getProduct(productId);
    if (!product?.isActive) continue;
    const sk = `WISH#${productId}`;
    if (!(await getItem(customersTable(), `USER#${userId}`, sk))) {
      await putItem(customersTable(), { PK: `USER#${userId}`, SK: sk, entityType: "wish", productId, createdAt: nowIso() });
    }
  }
  return listWishlist(userId);
}

async function configList<T>(pk: string): Promise<T[]> {
  const items = await queryPk(configTable(), pk);
  return items as unknown as T[];
}

export async function listCoupons(): Promise<Coupon[]> {
  return (await configList<Coupon>("COUPON")).sort((a, b) => a.code.localeCompare(b.code));
}

export async function activeCoupon(code: string): Promise<Coupon | null> {
  const coupon = (await listCoupons()).find((item) => item.code === code.toUpperCase() && item.active);
  if (!coupon) return null;
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) return null;
  return coupon;
}

export async function saveCoupon(input: Omit<Coupon, "id"> & { id?: string }): Promise<Coupon> {
  const coupon: Coupon = {
    id: input.id ?? id("cpn"),
    code: input.code.toUpperCase(),
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal,
    active: input.active,
    note: input.note || "",
    expiresAt: input.expiresAt || null,
  };
  await putItem(configTable(), { PK: "COUPON", SK: coupon.id, entityType: "coupon", ...coupon });
  return coupon;
}

export async function listPromotions(): Promise<Promotion[]> {
  return (await configList<Promotion>("PROMO")).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function currentAnnouncement(): Promise<Promotion | null> {
  const now = Date.now();
  return (
    (await listPromotions()).find((item) => {
      if (!item.active || item.kind !== "announcement") return false;
      if (item.startsAt && Date.parse(item.startsAt) > now) return false;
      if (item.endsAt && Date.parse(item.endsAt) < now) return false;
      return true;
    }) ?? null
  );
}

export async function savePromotion(input: Omit<Promotion, "id" | "createdAt"> & { id?: string }): Promise<Promotion> {
  const existing = input.id ? (await listPromotions()).find((item) => item.id === input.id) : undefined;
  const promotion: Promotion = {
    id: input.id ?? id("prm"),
    title: input.title,
    message: input.message,
    href: input.href || "",
    kind: input.kind || "announcement",
    active: input.active,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  await putItem(configTable(), { PK: "PROMO", SK: promotion.id, entityType: "promotion", ...promotion });
  return promotion;
}

export async function deletePromotion(promotionId: string): Promise<void> {
  await deleteItem(configTable(), "PROMO", promotionId);
}

export async function listReviews(): Promise<Review[]> {
  return (await configList<Review>("REVIEW")).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 12);
}

export async function addReview(input: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const review: Review = { ...input, id: id("rev"), createdAt: nowIso() };
  await putItem(configTable(), { PK: "REVIEW", SK: `${review.createdAt}#${review.id}`, entityType: "review", ...review });
  return review;
}

type ProductReviewRow = {
  id: string;
  userId: string;
  name: string;
  productSlug: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function lineMatches(item: OrderItem, product: { id: string; sku: string; name: string }): boolean {
  return item.productId === product.id || item.sku === product.sku || item.name === product.name || item.name.startsWith(`${product.name} —`);
}

async function ordersForBuyer(user: PublicUser): Promise<Order[]> {
  const [owned, emailed] = await Promise.all([
    ordersForUser(user.id),
    queryIndex(ordersTable(), "GSI2", `EMAIL#${user.email.toLowerCase()}`),
  ]);
  const extra = emailed.filter((item) => item.entityType === "order").map((item) => item as unknown as Order);
  const seen = new Set<string>();
  return [...owned, ...extra].filter((order) => {
    if (seen.has(order.id)) return false;
    seen.add(order.id);
    return true;
  });
}

async function productReviewRows(slug: string): Promise<ProductReviewRow[]> {
  return (await configList<ProductReviewRow>(`PRODUCTREVIEW#${slug}`)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function productReviewState(slug: string, user: PublicUser | null) {
  const product = await getProductBySlug(slug);
  if (!product) throw new StoreError("This product is not available.", 404);
  const rows = (await productReviewRows(slug)).slice(0, 24);
  const summary = reviewSummary(rows);
  const reviews = rows.map((row) => ({ id: row.id, name: row.name, rating: row.rating, comment: row.comment, createdAt: row.createdAt }));
  if (!user) return { ...summary, reviews, canReview: false, reason: "signed-out" as const };
  if (rows.some((row) => row.userId === user.id)) return { ...summary, reviews, canReview: false, reason: "already-reviewed" as const };
  const order = (await ordersForBuyer(user)).find((entry) => entry.status !== "cancelled" && entry.items.some((item) => lineMatches(item, product)));
  if (!order) return { ...summary, reviews, canReview: false, reason: "not-purchased" as const };
  return { ...summary, reviews, canReview: true, reason: null };
}

export async function addProductReview(user: PublicUser, slug: string, rating: number, comment: string) {
  const product = await getProductBySlug(slug);
  if (!product) throw new StoreError("This product is not available.", 404);
  const rows = await productReviewRows(slug);
  const order = (await ordersForBuyer(user)).find((entry) => entry.status !== "cancelled" && entry.items.some((item) => lineMatches(item, product)));
  const decision = reviewDecision({
    userId: user.id,
    purchasedOrderId: order?.id ?? null,
    existing: rows.map((row) => ({ userId: row.userId, productSlug: row.productSlug, rating: row.rating })),
    productSlug: slug,
    rating,
    comment,
  });
  if (!decision.ok) throw new StoreError(decision.error, decision.status);
  const review: ProductReviewRow = {
    id: id("prv"),
    userId: user.id,
    name: user.name,
    productSlug: slug,
    orderId: decision.orderId,
    rating,
    comment: comment.trim().slice(0, 600),
    createdAt: nowIso(),
  };
  await putItem(configTable(), { PK: `PRODUCTREVIEW#${slug}`, SK: `${review.createdAt}#${review.id}`, entityType: "productReview", ...review });
  return { review: { id: review.id, name: review.name, rating: review.rating, comment: review.comment, createdAt: review.createdAt } };
}

export async function listInquiries(): Promise<Inquiry[]> {
  return (await configList<Inquiry>("INQUIRY")).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function addInquiry(input: Omit<Inquiry, "id" | "createdAt" | "status"> & { status?: string }): Promise<Inquiry> {
  const inquiry: Inquiry = {
    id: id("inq"),
    type: input.type,
    name: input.name || "",
    email: input.email.toLowerCase(),
    phone: input.phone || "",
    business: input.business || "",
    city: input.city || "",
    subject: input.subject || "",
    message: input.message || "",
    productInterest: input.productInterest || "",
    quantity: input.quantity || "",
    status: input.status || "new",
    createdAt: nowIso(),
  };
  await putItem(configTable(), { PK: "INQUIRY", SK: `${inquiry.createdAt}#${inquiry.id}`, entityType: "inquiry", ...inquiry });
  return inquiry;
}

export async function newsletter(email: string): Promise<{ created: boolean }> {
  const existing = (await listInquiries()).find((item) => item.type === "newsletter" && item.email === email.toLowerCase());
  if (existing) return { created: false };
  await addInquiry({ type: "newsletter", email, name: "", phone: "", business: "", city: "", subject: "", message: "", productInterest: "", quantity: "" });
  return { created: true };
}

export async function updateInquiry(inquiryId: string, status: string): Promise<void> {
  const inquiry = (await listInquiries()).find((item) => item.id === inquiryId);
  if (!inquiry) throw new StoreError("Enquiry not found.", 404);
  await putItem(configTable(), { PK: "INQUIRY", SK: `${inquiry.createdAt}#${inquiry.id}`, entityType: "inquiry", ...inquiry, status });
}

async function writeOrder(order: Order): Promise<void> {
  await putItem(ordersTable(), {
    PK: `ORDER#${order.id}`,
    SK: "META",
    GSI1PK: `NUMBER#${order.orderNumber}`,
    GSI1SK: "META",
    GSI2PK: `EMAIL#${order.email}`,
    GSI2SK: order.createdAt,
    GSI3PK: order.userId ? `USER#${order.userId}` : "GUEST",
    GSI3SK: order.createdAt,
    entityType: "order",
    ...order,
  });
  if (order.idempotencyKey) {
    await putItem(ordersTable(), { PK: `IDEM#${order.idempotencyKey}`, SK: "META", entityType: "idempotency", orderId: order.id });
  }
}

async function orderByIdempotency(key: string): Promise<Order | null> {
  const marker = await getItem(ordersTable(), `IDEM#${key}`, "META");
  if (!marker) return null;
  const item = await getItem(ordersTable(), `ORDER#${marker.orderId}`, "META");
  return item ? (item as unknown as Order) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const items = await queryIndex(ordersTable(), "GSI1", `NUMBER#${orderNumber}`);
  const item = items.find((entry) => entry.entityType === "order");
  return item ? (item as unknown as Order) : null;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const item = await getItem(ordersTable(), `ORDER#${orderId}`, "META");
  return item ? (item as unknown as Order) : null;
}

export async function ordersForUser(userId: string): Promise<Order[]> {
  const items = await queryIndex(ordersTable(), "GSI3", `USER#${userId}`);
  return items
    .filter((item) => item.entityType === "order")
    .map((item) => item as unknown as Order)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function orderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let value = "BD-";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

async function changeStock(productId: string, variantId: string | null, qty: number, direction: 1 | -1): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const product = await getProduct(productId);
    if (!product) throw new StoreError("A product in your cart is no longer available.");
    const next: Product = { ...product, images: product.images.map((image) => ({ ...image })), variants: product.variants.map((variant) => ({ ...variant })) };
    if (variantId) {
      const variant = next.variants.find((item) => item.id === variantId);
      if (!variant) throw new StoreError("Choose an option again on the product page.");
      if (direction < 0 && variant.stock < qty) throw new StoreError(`${product.name} (${variant.name}) does not have enough stock.`);
      variant.stock += direction * qty;
    } else {
      if (next.variants.length > 0 && direction < 0) throw new StoreError(`Choose an option for ${product.name}.`);
      if (direction < 0 && next.stock < qty) throw new StoreError(`${product.name} does not have enough stock.`);
      next.stock += direction * qty;
    }
    next.version = product.version + 1;
    next.updatedAt = nowIso();
    try {
      await writeProduct(next, product.version);
      return;
    } catch (error) {
      if (!isConflict(error) || attempt === 3) throw error;
    }
  }
}

export async function quoteCart(items: Array<{ productId: string; variantId?: string | null; qty: number }>, userId?: string | null) {
  const lines = [];
  for (const item of items) {
    const product = await getProduct(item.productId);
    const key = `${item.productId}:${item.variantId || ""}`;
    if (!product || !product.isActive) {
      lines.push({
        key, productId: item.productId, variantId: item.variantId || null, slug: "", name: "Unavailable product", variantName: null,
        unitPrice: 0, image: "", sku: "", qty: item.qty, maxQty: 0, available: false, message: "This product is no longer available.",
      });
      continue;
    }
    const image = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || "";
    if (product.variants.length > 0) {
      const variant = product.variants.find((entry) => entry.id === item.variantId);
      if (!variant) {
        lines.push({
          key, productId: product.id, variantId: item.variantId || null, slug: product.slug, name: product.name, variantName: null,
          unitPrice: product.price, image, sku: product.sku, qty: item.qty, maxQty: 0, available: false,
          message: "Choose an option again on the product page.",
        });
        continue;
      }
      const qty = Math.min(item.qty, variant.stock, MAX_LINE_QTY);
      lines.push({
        key, productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, variantName: variant.name,
        unitPrice: sellingPrice(product.price, variant.price), image: variant.image || image, sku: variant.sku, qty,
        maxQty: Math.min(variant.stock, MAX_LINE_QTY), available: qty > 0,
        message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
      });
    } else {
      const qty = Math.min(item.qty, product.stock, MAX_LINE_QTY);
      lines.push({
        key, productId: product.id, variantId: null, slug: product.slug, name: product.name, variantName: null,
        unitPrice: product.price, image, sku: product.sku, qty, maxQty: Math.min(product.stock, MAX_LINE_QTY), available: qty > 0,
        message: qty === 0 ? "Out of stock." : qty < item.qty ? `Only ${qty} available.` : undefined,
      });
    }
  }
  if (userId) {
    await putItem(cartsTable(), {
      PK: `USER#${userId}`,
      SK: "CART",
      entityType: "cart",
      items: lines,
      updatedAt: nowIso(),
      expiresAt: ttlInDays(30),
    });
  }
  return lines;
}

type PlaceInput = {
  idempotencyKey: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
  couponCode: string;
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  items: Array<{ productId: string; variantId?: string | null; qty: number }>;
};

export async function placeOrder(input: PlaceInput): Promise<Order> {
  const existing = await orderByIdempotency(input.idempotencyKey);
  if (existing) {
    if (existing.email !== input.email.toLowerCase()) throw new StoreError("This checkout was already used.", 409);
    return existing;
  }
  const code = input.couponCode.trim().toUpperCase();
  const coupon = code ? await activeCoupon(code) : null;
  if (code && !coupon) throw new StoreError("That coupon is not valid.");

  return exclusive(async () => {
    const duplicate = await orderByIdempotency(input.idempotencyKey);
    if (duplicate) return duplicate;
    const taken: Array<{ productId: string; variantId: string | null; qty: number }> = [];
    const lines: OrderItem[] = [];
    let subtotal = 0;
    try {
      for (const item of input.items) {
        if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_LINE_QTY) throw new StoreError("Check the quantities in your cart.");
        const product = await getProduct(item.productId);
        if (!product || !product.isActive) throw new StoreError("A product in your cart is no longer available.");
        let unitPrice = product.price;
        let sku = product.sku;
        let name = product.name;
        let variantId: string | null = null;
        if (product.variants.length > 0) {
          const variant = product.variants.find((entry) => entry.id === item.variantId);
          if (!variant) throw new StoreError(`Choose an option for ${product.name}.`);
          variantId = variant.id;
          unitPrice = variant.price ?? product.price;
          sku = variant.sku;
          name = `${product.name} — ${variant.name}`;
        } else if (item.variantId) {
          throw new StoreError(`That option is not available for ${product.name}.`);
        }
        await changeStock(product.id, variantId, item.qty, -1);
        taken.push({ productId: product.id, variantId, qty: item.qty });
        subtotal += unitPrice * item.qty;
        lines.push({
          id: id("line"),
          productId: product.id,
          variantId,
          name,
          sku,
          unitPrice,
          qty: item.qty,
          image: product.images[0]?.url || "",
        });
      }
      const discount = coupon ? couponDiscount(subtotal, coupon) : 0;
      if (coupon && discount <= 0) throw new StoreError(`That coupon needs a subtotal of at least ₹${coupon.minSubtotal}.`);
      const shipping = shippingCharge(subtotal - discount);
      const total = orderTotal(subtotal, discount, shipping);
      const order: Order = {
        id: id("ord"),
        orderNumber: orderNumber(),
        accessToken: crypto.randomBytes(24).toString("hex"),
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        email: input.email.toLowerCase(),
        name: input.name,
        phone: input.phone,
        status: "placed",
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        subtotal,
        discount,
        shipping,
        total,
        couponCode: coupon ? coupon.code : "",
        addressLine1: input.address.line1,
        addressLine2: input.address.line2,
        city: input.address.city,
        state: input.address.state,
        pincode: input.address.pincode,
        notes: input.notes,
        trackingNote: "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        items: lines,
      };
      await writeOrder(order);
      return order;
    } catch (error) {
      for (const line of taken) await changeStock(line.productId, line.variantId, line.qty, 1);
      const again = await orderByIdempotency(input.idempotencyKey);
      if (again) return again;
      throw error;
    }
  });
}

export async function updateOrderStatus(orderId: string, input: { status: string; paymentStatus: string; trackingNote: string }): Promise<Order> {
  return exclusive(async () => {
    const order = await getOrder(orderId);
    if (!order) throw new StoreError("Order not found.", 404);
    if (order.status === "cancelled" && input.status !== "cancelled") {
      throw new StoreError("A cancelled order stays cancelled so stock is not changed again.");
    }
    if (input.status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (!item.productId) continue;
        await changeStock(item.productId, item.variantId, item.qty, 1);
      }
    }
    const next: Order = { ...order, status: input.status, paymentStatus: input.paymentStatus, trackingNote: input.trackingNote, updatedAt: nowIso() };
    await writeOrder(next);
    return next;
  });
}

export type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
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
  images: Array<{ url: string; alt: string; sortOrder: number }>;
  variants: Array<{ name: string; sku: string; price: number | null; stock: number }>;
};

export async function saveProduct(input: ProductInput, productId?: string, creating = false): Promise<Product> {
  const existing = productId ? await getProduct(productId) : null;
  if (!creating && productId && !existing) throw new StoreError("Product not found.", 404);
  if (creating && existing) throw new StoreError("That slug or SKU is already used.");
  const categories = await listCategories();
  if (!categories.some((category) => category.id === input.categoryId)) throw new StoreError("Choose a category.");
  const ownerId = existing?.id ?? productId ?? id("prod");
  if (existing && existing.slug !== input.slug) await release("SLUG", existing.slug, ownerId);
  if (existing && existing.sku !== input.sku) await release("SKU", existing.sku, ownerId);
  for (const variant of existing?.variants ?? []) {
    if (!input.variants.some((item) => item.sku === variant.sku)) await release("SKU", variant.sku, ownerId);
  }
  await claim("SLUG", input.slug, ownerId);
  await claim("SKU", input.sku, ownerId);
  for (const variant of input.variants) await claim("SKU", variant.sku, ownerId);
  const product: Product = {
    id: ownerId,
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    description: input.description,
    shortDescription: input.shortDescription,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    stock: input.variants.length ? 0 : input.stock,
    categoryId: input.categoryId,
    specifications: input.specifications,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    wholesaleEligible: input.wholesaleEligible,
    minOrderQty: input.minOrderQty,
    wholesalePrice: input.wholesalePrice,
    viewCount: existing?.viewCount ?? 0,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    images: input.images.map((image, index) => ({ id: id("img"), url: image.url, alt: image.alt, sortOrder: index })),
    variants: input.variants.map((variant) => ({
      id: existing?.variants.find((item) => item.sku === variant.sku)?.id ?? id("var"),
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      image: "",
    })),
    version: (existing?.version ?? 0) + 1,
  };
  try {
    await writeProduct(product, existing ? existing.version : undefined);
  } catch (error) {
    if (isConflict(error)) throw new StoreError("The product changed. Reload and try again.", 409);
    throw error;
  }
  return product;
}

export async function saveCategory(input: Omit<Category, "id" | "parentId"> & { id?: string; parentId?: string | null }): Promise<Category> {
  const existing = input.id ? (await listCategories()).find((category) => category.id === input.id) : undefined;
  if (input.id && !existing) throw new StoreError("Category not found.", 404);
  const ownerId = existing?.id ?? id("cat");
  if (existing && existing.slug !== input.slug) await release("SLUG", existing.slug, ownerId);
  await claim("SLUG", input.slug, ownerId);
  const category: Category = {
    id: ownerId,
    name: input.name,
    slug: input.slug,
    description: input.description || "",
    image: input.image || "",
    sortOrder: input.sortOrder,
    parentId: input.parentId ?? existing?.parentId ?? null,
  };
  await writeCategory(category);
  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const products = await listProducts();
  if (products.some((product) => product.categoryId === categoryId)) {
    throw new StoreError("Move or archive the products in this category before deleting it.");
  }
  const category = (await listCategories()).find((item) => item.id === categoryId);
  if (!category) throw new StoreError("Category not found.", 404);
  await release("SLUG", category.slug, category.id);
  await deleteItem(productsTable(), `CATEGORY#${category.id}`, "META");
}

export async function dashboard() {
  const [products, orders, inquiries] = await Promise.all([listProducts(), loadOrders(), listInquiries()]);
  const recent = [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);
  return {
    products: products.length,
    orders: orders.length,
    inquiries: inquiries.filter((item) => item.status === "new" && item.type !== "newsletter").length,
    lowStock: products.filter((product) => product.isActive && product.variants.length === 0 && product.stock <= 5).length,
    recent,
  };
}

export async function adminCustomers() {
  const [items, orders] = await Promise.all([scanTable(customersTable()), loadOrders()]);
  return items
    .filter((item) => item.entityType === "user")
    .map((item) => item as unknown as UserRecord)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((user) => ({
      ...toPublic(user),
      createdAt: user.createdAt,
      _count: { orders: orders.filter((order) => order.userId === user.id).length },
    }));
}

export async function uploadImage(bytes: Buffer, extension: string, contentType: string): Promise<string> {
  const bucket = process.env.UPLOAD_BUCKET || process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new StoreError("Image storage is not configured.", 500);
  const key = `uploads/${crypto.randomBytes(12).toString("hex")}.${extension}`;
  const client = new S3Client({ region });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType, CacheControl: "public, max-age=31536000" }));
  const base = (process.env.CDN_BASE_URL || process.env.AWS_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function seedIfEmpty(): Promise<void> {
  const existing = await queryIndex(productsTable(), "GSI1", "PRODUCT");
  if (existing.length === 0) {
    for (const [slug, name, description, sortOrder] of starterCategories) {
      const category: Category = { id: `cat_${slug}`, name, slug, description, image: `/media/categories/${slug}.svg`, sortOrder, parentId: null };
      await claim("SLUG", slug, category.id);
      await writeCategory(category);
    }
    for (const product of starterProducts) {
      await saveProduct(
        {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          shortDescription: product.short,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? null,
          stock: product.variants ? 0 : product.stock,
          categoryId: `cat_${product.category}`,
          specifications: JSON.stringify(product.specs.map(([label, value]) => ({ label, value }))),
          isActive: true,
          isFeatured: Boolean(product.featured),
          wholesaleEligible: Boolean(product.wholesale),
          minOrderQty: product.wholesale?.moq ?? null,
          wholesalePrice: product.wholesale?.price ?? null,
          images: [{ url: `/media/products/${product.slug}.svg`, alt: product.name, sortOrder: 0 }],
          variants: (product.variants ?? []).map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price, stock: variant.stock })),
        },
        `prod_${product.slug}`,
        true,
      );
      const saved = await getProduct(`prod_${product.slug}`);
      if (saved) {
        saved.createdAt = new Date(Date.now() - product.minutesAgo * 60 * 1000).toISOString();
        await writeProduct(saved, saved.version);
        saved.version += 1;
      }
    }
  }
  if ((await listCoupons()).length === 0) {
    await saveCoupon({ code: "WELCOME50", type: "FIXED", value: 50, minSubtotal: 499, active: true, note: "Starter coupon. Disable it in admin if you do not want to offer it.", expiresAt: null });
  }
  if ((await listPromotions()).length === 0) {
    await savePromotion({
      title: "Shipping at checkout",
      message: "Shipping is ₹49, and free when the payable product total reaches ₹999.",
      href: "/shipping-policy",
      kind: "announcement",
      active: true,
      startsAt: null,
      endsAt: null,
    });
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 8 && !(await getUserByEmail(email))) {
    const user: UserRecord = {
      id: id("usr"),
      email,
      name: "Store admin",
      phone: "",
      role: "admin",
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await writeUser(user);
  }
}

export { publicProduct };
