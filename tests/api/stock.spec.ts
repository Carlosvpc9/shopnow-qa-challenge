import { test, expect } from "../fixtures";
import { resetData, USERS } from "../helpers";
import { PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-03] checkout rejects a quantity above the available stock with 409", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.checkout({ items: [{ productId: PRODUCTS.chair.id, quantity: PRODUCTS.chair.stock + 3 }] });
  expect(res.status()).toBe(409);

  const product = await (await api.getProduct(PRODUCTS.chair.id)).json();
  expect(product.stock).toBe(PRODUCTS.chair.stock);
});

for (const quantity of [-3, 0, 0.5]) {
  test(`[BUG-03] checkout rejects an invalid quantity (${quantity}) with 400`, async ({ api }) => {
    await api.login(USERS.ana);
    const res = await api.checkout({ items: [{ productId: PRODUCTS.mug.id, quantity }] });
    expect(res.status()).toBe(400);

    const product = await (await api.getProduct(PRODUCTS.mug.id)).json();
    expect(product.stock).toBe(PRODUCTS.mug.stock);
  });
}
