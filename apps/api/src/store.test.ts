import assert from "node:assert/strict";
import test from "node:test";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "test";
process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters";

test("starter catalogue can place a cash-on-delivery order", async () => {
  const { clearAll } = await import("./lib/tables");
  clearAll();
  const store = await import("./lib/store");
  await store.seedIfEmpty();
  const product = await store.getProduct("prod_seven-cup-masala-dabba");
  assert.ok(product);
  assert.equal(product.stock, 30);
  const order = await store.placeOrder({
    idempotencyKey: "test-order-1",
    userId: null,
    name: "Asha",
    email: "asha@example.com",
    phone: "9876543210",
    notes: "",
    couponCode: "WELCOME50",
    address: { line1: "12 Market Road", line2: "", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
    items: [{ productId: product.id, qty: 1 }],
  });
  assert.equal(order.paymentMethod, "cod");
  assert.equal(order.discount, 50);
  assert.equal(order.shipping, 49);
  assert.equal(order.total, 748);
  const updated = await store.getProduct(product.id);
  assert.equal(updated?.stock, 29);
  const again = await store.placeOrder({
    idempotencyKey: "test-order-1",
    userId: null,
    name: "Asha",
    email: "asha@example.com",
    phone: "9876543210",
    notes: "",
    couponCode: "WELCOME50",
    address: { line1: "12 Market Road", line2: "", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
    items: [{ productId: product.id, qty: 1 }],
  });
  assert.equal(again.orderNumber, order.orderNumber);
  assert.equal((await store.getProduct(product.id))?.stock, 29);
});

test("home catalogue is served from the store", async () => {
  const store = await import("./lib/store");
  await store.seedIfEmpty();
  const home = await store.homeData();
  assert.ok(home.productCount > 0);
  assert.ok(home.categories.length > 0);
  assert.equal(home.announcement?.title, "Shipping at checkout");
});
