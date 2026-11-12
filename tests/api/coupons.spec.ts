import { test, expect } from "../fixtures";
import { resetData, USERS } from "../helpers";
import { COUPONS, PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

// 2 × mug = $16.70 → 10 % = $1.67 → $15.03
const MUGS = [{ productId: PRODUCTS.mug.id, quantity: 2 }];

test("[BUG-05] the API validates a lowercase coupon code with its real percentage", async ({ api }) => {
  const res = await api.validateCoupon("flock10");
  expect(res.status()).toBe(200);
  expect((await res.json()).percent).toBe(10);
});

test("[BUG-05] checkout with a lowercase coupon code applies the discount", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({ items: MUGS, coupons: ["flock10"] });
  expect(res.status()).toBe(201);
  const order = await res.json();
  expect(order.discount).toBe(1.67);
  expect(order.total).toBe(15.03);
});

test("[BUG-02] checkout does not stack two different coupons", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({ items: MUGS, coupons: [COUPONS.flock10, COUPONS.bienvenida15] });

  // Spec: only one coupon per purchase. Accepted fixes: reject (400) or apply a single coupon.
  if (res.status() === 201) {
    const order = await res.json();
    expect(order.coupons).toHaveLength(1);
  } else {
    expect(res.status()).toBe(400);
  }
});

test("[BUG-02] repeating a coupon never discounts more than once nor makes the total negative", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({ items: MUGS, coupons: Array(11).fill(COUPONS.flock10) });

  if (res.status() === 201) {
    const order = await res.json();
    expect(order.discount).toBe(1.67);
    expect(order.total).toBe(15.03);
  } else {
    expect(res.status()).toBe(400);
  }
});
