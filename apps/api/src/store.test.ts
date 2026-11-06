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

test("signup stays pending until the code matches", async () => {
  const { clearAll } = await import("./lib/tables");
  clearAll();
  const store = await import("./lib/store");
  const issued = "a".repeat(64);
  const started = await store.beginSignup({
    email: "Gungun.Kalra@MyDGV.com",
    name: "Gungun",
    phone: "",
    password: "Secret123",
    otpHash: issued,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  assert.equal(started.status, "sent");
  const again = await store.beginSignup({
    email: "gungun.kalra@mydgv.com",
    name: "Someone else",
    phone: "9999999999",
    password: "Changed123",
    otpHash: "b".repeat(64),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  assert.equal(again.status, "cooldown");
  await assert.rejects(() => store.completeSignup({ email: "gungun.kalra@mydgv.com", otpHash: "b".repeat(64) }), /not correct/);
  const staff = await store.completeSignup({ email: "gungun.kalra@mydgv.com", otpHash: issued });
  assert.equal(staff.role, "admin");
  assert.equal((await store.loginUser("gungun.kalra@mydgv.com", "Secret123")).role, "admin");
  await assert.rejects(() => store.loginUser("gungun.kalra@mydgv.com", "Changed123"), /not correct/);

  const shopperHash = "c".repeat(64);
  await store.beginSignup({
    email: "shopper@example.com",
    name: "Shopper",
    phone: "",
    password: "Secret123",
    otpHash: shopperHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  const shopper = await store.completeSignup({ email: "shopper@example.com", otpHash: shopperHash });
  assert.equal(shopper.role, "customer");
  await assert.rejects(
    () => store.beginSignup({
      email: "shopper@example.com",
      name: "Shopper",
      phone: "",
      password: "Secret123",
      otpHash: shopperHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }),
    /already exists/,
  );

  const lockedHash = "e".repeat(64);
  await store.beginSignup({
    email: "locked@example.com",
    name: "Locked",
    phone: "",
    password: "Secret123",
    otpHash: lockedHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await assert.rejects(() => store.completeSignup({ email: "locked@example.com", otpHash: "d".repeat(64) }), /not correct/);
  }
  await assert.rejects(() => store.completeSignup({ email: "locked@example.com", otpHash: "d".repeat(64) }), /Too many incorrect codes/);
  await assert.rejects(() => store.completeSignup({ email: "locked@example.com", otpHash: lockedHash }), /Too many incorrect codes/);
  const cooled = await store.refreshSignup({
    email: "locked@example.com",
    otpHash: lockedHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  assert.equal(cooled.status, "cooldown");
});
