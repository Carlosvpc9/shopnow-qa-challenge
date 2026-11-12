import { test, expect } from "../fixtures";
import { resetData, USERS } from "../helpers";
import { PRODUCTS, SHIPPING } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-09] the order is charged the correctly rounded amount (3 × $8.35 = $25.05)", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({ items: [{ productId: PRODUCTS.mug.id, quantity: 3 }] });
  expect(res.status()).toBe(201);
  const order = await res.json();
  expect(order.subtotal).toBe(25.05);
  expect(order.total).toBe(25.05);
});

test("[BUG-11] shipping details with accents, ñ and º are accepted", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({
    items: [{ productId: PRODUCTS.mug.id, quantity: 1 }],
    shipping: SHIPPING.spanish,
  });
  expect(res.status()).toBe(201);
  const order = await res.json();
  expect(order.shipping).toEqual(SHIPPING.spanish);
});
