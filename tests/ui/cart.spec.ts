import { test, expect } from "../fixtures";
import { resetData } from "../helpers";
import { PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("the cart total is calculated correctly", async ({ productPage, cartPage }) => {
  await productPage.add(PRODUCTS.mug.id, 2);
  await cartPage.goto();
  await expect(cartPage.line(PRODUCTS.mug.id)).toBeVisible();
  // 2 × $8.35
  await expect(cartPage.lineTotal(PRODUCTS.mug.id)).toHaveText("$16.70");
  await expect(cartPage.subtotal).toHaveText("$16.70");
  await expect(cartPage.total).toHaveText("$16.70");
});

test("[BUG-06] a product added from the catalog stays in the cart after reloading", async ({ catalogPage, cartPage }) => {
  await catalogPage.goto();
  await catalogPage.quickAdd(PRODUCTS.tshirt.id);
  await expect(catalogPage.navCart).toHaveText("Cart (1)");

  await catalogPage.reload();
  await expect(catalogPage.navCart).toHaveText("Cart (1)");

  await cartPage.goto();
  await expect(cartPage.line(PRODUCTS.tshirt.id)).toBeVisible();
});

test("[BUG-06] catalog and detail-page adds are both kept after reloading", async ({ catalogPage, productPage, cartPage }) => {
  await catalogPage.goto();
  await catalogPage.quickAdd(PRODUCTS.tshirt.id);
  await productPage.add(PRODUCTS.mug.id, 1);

  await cartPage.goto();
  await cartPage.reload();
  await expect(cartPage.line(PRODUCTS.tshirt.id)).toBeVisible();
  await expect(cartPage.line(PRODUCTS.mug.id)).toBeVisible();
});

test("[BUG-09] line total and cart total are rounded to the cent (3 × $8.35 = $25.05)", async ({ productPage, cartPage }) => {
  await productPage.add(PRODUCTS.mug.id, 3);
  await cartPage.goto();
  await expect(cartPage.lineTotal(PRODUCTS.mug.id)).toHaveText("$25.05");
  await expect(cartPage.subtotal).toHaveText("$25.05");
  await expect(cartPage.total).toHaveText("$25.05");
});
