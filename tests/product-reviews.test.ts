import assert from "node:assert/strict";
import test from "node:test";
import { reviewDecision, reviewSummary } from "../src/lib/product-reviews";

const base = {
  userId: "user_1",
  purchasedOrderId: "order_1",
  existing: [] as Array<{ userId: string; productSlug: string; rating: number }>,
  productSlug: "iron-dosa-tawa",
  rating: 5,
  comment: "The tawa heated evenly.",
};

test("averages the ratings customers submitted", () => {
  assert.deepEqual(reviewSummary([]), { average: null, count: 0 });
  assert.deepEqual(reviewSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }]), { average: 4.3, count: 3 });
});

test("rejects a review from someone who has not bought the product", () => {
  const decision = reviewDecision({ ...base, purchasedOrderId: null });
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.status, 403);
});

test("rejects a signed-out review", () => {
  const decision = reviewDecision({ ...base, userId: null });
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.status, 401);
});

test("rejects a second review of the same product by the same customer", () => {
  const decision = reviewDecision({
    ...base,
    existing: [{ userId: "user_1", productSlug: "iron-dosa-tawa", rating: 4 }],
  });
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.status, 409);
});

test("allows one review after a real purchase", () => {
  const decision = reviewDecision({
    ...base,
    existing: [{ userId: "user_2", productSlug: "iron-dosa-tawa", rating: 3 }],
  });
  assert.deepEqual(decision, { ok: true, orderId: "order_1" });
});
