import { test, expect } from "../fixtures";
import { resetData } from "../helpers";
import { PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-08] adding from the catalog cannot exceed the available stock", async ({ catalogPage }) => {
  await catalogPage.goto();
  await catalogPage.quickAdd(PRODUCTS.headphones.id, PRODUCTS.headphones.stock + 2);

  await expect(catalogPage.navCart).toHaveText(`Cart (${PRODUCTS.headphones.stock})`);
});

test("[BUG-08] adding the same product twice from its page cannot exceed the available stock", async ({ productPage, cartPage }) => {
  await productPage.add(PRODUCTS.chair.id, 2);
  await productPage.addToCart(2);

  await cartPage.goto();
  await expect(cartPage.quantityInput(PRODUCTS.chair.id)).toHaveValue(String(PRODUCTS.chair.stock));
});
