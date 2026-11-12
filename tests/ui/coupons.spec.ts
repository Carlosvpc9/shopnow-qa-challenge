import { test, expect } from "../fixtures";
import { resetData } from "../helpers";
import { COUPONS, PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-05] a lowercase coupon code gives the same discount as the uppercase code", async ({ productPage, cartPage }) => {
  await productPage.add(PRODUCTS.mug.id, 2);
  await cartPage.goto();
  await cartPage.applyCoupon("flock10");

  await expect(cartPage.appliedCoupons).toContainText("10%");
  await expect(cartPage.discount).toHaveText("-$1.67");
  await expect(cartPage.total).toHaveText("$15.03");
});

test("[BUG-07] a second coupon is rejected after reloading the cart", async ({ productPage, cartPage }) => {
  await productPage.add(PRODUCTS.mug.id, 2);
  await cartPage.goto();
  await cartPage.applyCoupon(COUPONS.flock10);
  await expect(cartPage.appliedCoupons).toHaveCount(1);

  await cartPage.reload();
  await cartPage.applyCoupon(COUPONS.bienvenida15);

  await expect(cartPage.couponError).toBeVisible();
  await expect(cartPage.appliedCoupons).toHaveCount(1);
  await expect(cartPage.total).toHaveText("$15.03");
});
