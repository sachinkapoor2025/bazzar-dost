import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAdmin, requireUser } from "./lib/auth";
import { corsPreflight, json, ok } from "./lib/response";
import { StoreError } from "./lib/store";
import * as store from "./lib/store";

function bodyOf(event: APIGatewayProxyEventV2): Record<string, unknown> {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
}

function match(method: string, path: string, spec: string): Record<string, string> | null {
  const space = spec.indexOf(" ");
  const specMethod = spec.slice(0, space);
  const specPath = spec.slice(space + 1);
  if (specMethod !== method) return null;
  const expected = specPath.split("/").filter(Boolean);
  const actual = path.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index].startsWith(":")) params[expected[index].slice(1)] = decodeURIComponent(actual[index]);
    else if (expected[index] !== actual[index]) return null;
  }
  return params;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function fail(error: unknown): APIGatewayProxyResultV2 {
  if (error instanceof StoreError) return json(error.status, { error: error.message });
  if (error instanceof SyntaxError) return json(400, { error: "Check the form and try again." });
  console.error(error);
  return json(500, { error: "Something went wrong. Please try again." });
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath || "/";
  if (method === "OPTIONS") return corsPreflight();
  try {
    if (match(method, path, "GET /health")) return ok({ ok: true, service: "bazaardost-api" });
    if (match(method, path, "GET /home")) return ok(await store.homeData());
    if (match(method, path, "POST /catalog")) return ok(await store.searchCatalog(bodyOf(event) as never));
    if (match(method, path, "GET /categories")) {
      const scope = event.queryStringParameters?.scope === "all" ? "all" : "top";
      return ok(await store.categoriesFor(scope));
    }
    const category = match(method, path, "GET /categories/:slug");
    if (category) {
      const found = await store.categoryBySlug(category.slug);
      return found ? ok(found) : json(404, { error: "Category not found." });
    }
    if (match(method, path, "GET /products/by-ids")) return ok(await store.productsByIds((event.queryStringParameters?.ids || "").split(",").filter(Boolean)));
    if (match(method, path, "GET /products/by-slugs")) return ok(await store.productsBySlugs((event.queryStringParameters?.slugs || "").split(",").filter(Boolean)));
    const togetherById = match(method, path, "GET /bought-together/:productId");
    if (togetherById) return ok(await store.togetherFor(togetherById.productId));
    const relatedById = match(method, path, "GET /related/:categoryId/:productId");
    if (relatedById) return ok(await store.relatedFor(relatedById.categoryId, relatedById.productId));
    if (match(method, path, "GET /wholesale")) return ok(await store.cardsFor("wholesale", Number(event.queryStringParameters?.take || 24)));
    if (match(method, path, "GET /reviews")) return ok(await store.listReviews());
    if (match(method, path, "GET /announcement")) return ok(await store.currentAnnouncement());
    if (match(method, path, "GET /sitemap")) return ok(await store.sitemapData());
    if (match(method, path, "GET /catalogue")) return ok(await store.catalogueRows());
    const product = match(method, path, "GET /products/:slug");
    if (product) {
      const found = await store.getProductBySlug(product.slug);
      return found ? ok(found) : json(404, { error: "Product not found." });
    }
    const related = match(method, path, "GET /products/:slug/related");
    if (related) {
      const found = await store.getProductBySlug(related.slug);
      if (!found) return json(404, { error: "Product not found." });
      return ok(await store.relatedFor(found.categoryId, found.id));
    }
    const together = match(method, path, "GET /products/:slug/together");
    if (together) {
      const found = await store.getProductBySlug(together.slug);
      if (!found) return json(404, { error: "Product not found." });
      return ok(await store.togetherFor(found.id));
    }
    const view = match(method, path, "POST /products/:slug/view");
    if (view) {
      await store.recordView(view.slug);
      return ok({ ok: true });
    }
    const productReviews = match(method, path, "GET /products/:slug/reviews");
    if (productReviews) {
      const user = await requireUser(event);
      return ok(await store.productReviewState(productReviews.slug, user));
    }
    const postProductReview = match(method, path, "POST /products/:slug/reviews");
    if (postProductReview) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in to review a product you have bought." });
      const body = bodyOf(event);
      if (text(body.website)) return ok({ message: "Review saved." });
      return ok(await store.addProductReview(user, postProductReview.slug, Number(body.rating), text(body.comment)));
    }
    if (match(method, path, "POST /reviews")) {
      const body = bodyOf(event);
      const review = await store.addReview({
        name: text(body.name),
        city: text(body.city),
        rating: Number(body.rating),
        comment: text(body.comment),
      });
      return ok(review);
    }
    if (match(method, path, "POST /cart/quote")) {
      const user = await requireUser(event);
      const body = bodyOf(event);
      const items = Array.isArray(body.items) ? (body.items as Array<{ productId: string; variantId?: string | null; qty: number }>) : [];
      return ok({ lines: await store.quoteCart(items, user?.id) });
    }
    if (match(method, path, "POST /coupons/validate")) {
      const body = bodyOf(event);
      const coupon = await store.activeCoupon(text(body.code));
      if (!coupon) return json(400, { error: "That coupon is not valid." });
      return ok(coupon);
    }
    if (match(method, path, "POST /orders")) {
      const user = await requireUser(event);
      const body = bodyOf(event);
      const address = (body.address ?? {}) as Record<string, unknown>;
      const order = await store.placeOrder({
        idempotencyKey: text(body.idempotencyKey),
        userId: user?.id ?? null,
        name: text(body.name),
        email: text(body.email),
        phone: text(body.phone),
        notes: text(body.notes),
        couponCode: text(body.couponCode),
        address: {
          line1: text(address.line1),
          line2: text(address.line2),
          city: text(address.city),
          state: text(address.state),
          pincode: text(address.pincode),
        },
        items: Array.isArray(body.items) ? (body.items as Array<{ productId: string; variantId?: string | null; qty: number }>) : [],
      });
      return ok(order);
    }
    const orderNumber = match(method, path, "GET /orders/number/:orderNumber");
    if (orderNumber) {
      const order = await store.getOrderByNumber(orderNumber.orderNumber);
      const user = await requireUser(event);
      const token = event.queryStringParameters?.token || "";
      if (!order) return json(404, { error: "Order not found." });
      if ((user && order.userId === user.id) || (token && token === order.accessToken)) return ok(order);
      return json(404, { error: "Order not found." });
    }
    if (match(method, path, "POST /track")) {
      const body = bodyOf(event);
      const order = await store.getOrderByNumber(text(body.orderNumber).trim().toUpperCase());
      if (!order || order.email !== text(body.email).toLowerCase()) return json(404, { error: "No order matches those details." });
      return ok({
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        total: order.total,
        trackingNote: order.trackingNote,
        items: order.items.map((item) => ({ name: item.name, qty: item.qty })),
      });
    }
    if (match(method, path, "POST /auth/register")) return ok(await store.registerUser(bodyOf(event) as never));
    if (match(method, path, "POST /auth/login")) {
      const body = bodyOf(event);
      return ok(await store.loginUser(text(body.email), text(body.password)));
    }
    if (match(method, path, "GET /auth/me")) {
      const user = await requireUser(event);
      return user ? ok(user) : json(401, { error: "Sign in required." });
    }
    if (match(method, path, "POST /auth/reset-tokens")) {
      const body = bodyOf(event);
      return ok({ found: await store.createResetToken(text(body.email), text(body.tokenHash), text(body.expiresAt)) });
    }
    if (match(method, path, "POST /auth/reset")) {
      const body = bodyOf(event);
      await store.resetPassword(text(body.tokenHash), text(body.password));
      return ok({ ok: true });
    }
    if (match(method, path, "PATCH /account/profile")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      const body = bodyOf(event);
      await store.updateProfile(user.id, { name: text(body.name), phone: text(body.phone) });
      return ok({ ok: true });
    }
    if (match(method, path, "GET /account/addresses")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok(await store.listAddresses(user.id));
    }
    if (match(method, path, "POST /account/addresses")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok(await store.addAddress(user.id, bodyOf(event) as never));
    }
    const removeAddress = match(method, path, "DELETE /account/addresses/:id");
    if (removeAddress) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok(await store.deleteAddress(user.id, removeAddress.id));
    }
    if (match(method, path, "GET /account/orders")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok(await store.ordersForUser(user.id));
    }
    const accountOrder = match(method, path, "GET /account/orders/:orderNumber");
    if (accountOrder) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      const order = await store.getOrderByNumber(accountOrder.orderNumber);
      if (!order || order.userId !== user.id) return json(404, { error: "Order not found." });
      return ok(order);
    }
    if (match(method, path, "GET /wishlist")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok({ productIds: await store.listWishlist(user.id) });
    }
    if (match(method, path, "POST /wishlist")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      return ok(await store.toggleWishlist(user.id, text(bodyOf(event).productId)));
    }
    if (match(method, path, "POST /wishlist/sync")) {
      const user = await requireUser(event);
      if (!user) return json(401, { error: "Sign in required." });
      const ids = bodyOf(event).productIds;
      return ok({ productIds: await store.syncWishlist(user.id, Array.isArray(ids) ? ids.map(String) : []) });
    }
    if (match(method, path, "POST /inquiries")) return ok(await store.addInquiry(bodyOf(event) as never));
    if (match(method, path, "POST /newsletter")) {
      const result = await store.newsletter(text(bodyOf(event).email));
      return ok(result);
    }

    const admin = await requireAdmin(event);
    const adminRoute = path.startsWith("/admin");
    if (adminRoute && !admin) return json(401, { error: "Admin access is required." });
    if (match(method, path, "GET /admin/dashboard")) return ok(await store.dashboard());
    if (match(method, path, "GET /admin/products")) {
      const products = await store.listProducts();
      const categories = await store.listCategories();
      return ok(products
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((product) => ({ ...product, category: categories.find((category) => category.id === product.categoryId) ?? { name: "Catalogue" } })));
    }
    const adminProduct = match(method, path, "GET /admin/products/:id");
    if (adminProduct) {
      const found = await store.getProductRecord(adminProduct.id);
      return found ? ok(found) : json(404, { error: "Product not found." });
    }
    if (match(method, path, "POST /admin/products")) return ok(await store.saveProduct(bodyOf(event) as never));
    const patchProduct = match(method, path, "PATCH /admin/products/:id");
    if (patchProduct) return ok(await store.saveProduct(bodyOf(event) as never, patchProduct.id));
    if (match(method, path, "GET /admin/categories")) return ok(await store.listCategories());
    if (match(method, path, "POST /admin/categories")) return ok(await store.saveCategory(bodyOf(event) as never));
    const patchCategory = match(method, path, "PATCH /admin/categories/:id");
    if (patchCategory) return ok(await store.saveCategory({ ...(bodyOf(event) as object), id: patchCategory.id } as never));
    const deleteCategory = match(method, path, "DELETE /admin/categories/:id");
    if (deleteCategory) {
      await store.deleteCategory(deleteCategory.id);
      return ok({ ok: true });
    }
    if (match(method, path, "GET /admin/coupons")) return ok(await store.listCoupons());
    if (match(method, path, "POST /admin/coupons")) return ok(await store.saveCoupon(bodyOf(event) as never));
    const patchCoupon = match(method, path, "PATCH /admin/coupons/:id");
    if (patchCoupon) return ok(await store.saveCoupon({ ...(bodyOf(event) as object), id: patchCoupon.id } as never));
    if (match(method, path, "GET /admin/promotions")) return ok(await store.listPromotions());
    if (match(method, path, "POST /admin/promotions")) return ok(await store.savePromotion(bodyOf(event) as never));
    const patchPromotion = match(method, path, "PATCH /admin/promotions/:id");
    if (patchPromotion) return ok(await store.savePromotion({ ...(bodyOf(event) as object), id: patchPromotion.id } as never));
    const deletePromotion = match(method, path, "DELETE /admin/promotions/:id");
    if (deletePromotion) {
      await store.deletePromotion(deletePromotion.id);
      return ok({ ok: true });
    }
    if (match(method, path, "GET /admin/orders")) return ok((await store.listAllOrders()).slice(0, 100));
    const adminOrder = match(method, path, "GET /admin/orders/:id");
    if (adminOrder) {
      const order = await store.getOrder(adminOrder.id);
      return order ? ok(order) : json(404, { error: "Order not found." });
    }
    const patchOrder = match(method, path, "PATCH /admin/orders/:id");
    if (patchOrder) {
      const body = bodyOf(event);
      return ok(await store.updateOrderStatus(patchOrder.id, { status: text(body.status), paymentStatus: text(body.paymentStatus), trackingNote: text(body.trackingNote) }));
    }
    if (match(method, path, "GET /admin/inquiries")) return ok(await store.listInquiries());
    const patchInquiry = match(method, path, "PATCH /admin/inquiries/:id");
    if (patchInquiry) {
      await store.updateInquiry(patchInquiry.id, text(bodyOf(event).status));
      return ok({ ok: true });
    }
    if (match(method, path, "GET /admin/customers")) return ok(await store.adminCustomers());
    if (match(method, path, "POST /admin/upload")) {
      const body = bodyOf(event);
      const bytes = Buffer.from(text(body.bodyBase64), "base64");
      return ok({ url: await store.uploadImage(bytes, text(body.extension), text(body.contentType)) });
    }
    return json(404, { error: "Not found." });
  } catch (error) {
    return fail(error);
  }
}
