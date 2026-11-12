import { test, expect } from "../fixtures";
import { login, resetData, USERS } from "../helpers";
import { CARDS, PRODUCTS, SEED, SHIPPING } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-01] an approved payment over $100 shows the order confirmation, not an error", async ({ page, productPage, checkoutPage, orderDetailPage }) => {
  await login(page, USERS.ana);
  await productPage.add(PRODUCTS.chair.id, 1); // $129.00 → slow payment path
  await checkoutPage.goto();
  await checkoutPage.pay(SHIPPING.valid, CARDS.approved);

  await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 10_000 });
  await expect(orderDetailPage.success).toBeVisible();
  await expect(checkoutPage.error).toHaveCount(0);
});

test("[BUG-01] the user is never charged while being told the payment failed", async ({ page, productPage, checkoutPage }) => {
  await login(page, USERS.ana);
  await productPage.add(PRODUCTS.chair.id, 1);
  await checkoutPage.goto();
  await checkoutPage.pay(SHIPPING.valid, CARDS.approved);

  // Wait until the UI shows an outcome: the order page or an error.
  await expect(page.getByTestId("order-success").or(checkoutPage.error)).toBeVisible({ timeout: 10_000 });
  // Give the server time to finish a payment the UI may have stopped waiting for (proving a late charge).
  await page.waitForTimeout(3_000);

  const payments = await (await page.request.get("/api/payments")).json();
  const newPayments = payments.length - SEED.anaPaymentsCount;

  if (await checkoutPage.error.isVisible()) {
    expect(newPayments, "a payment was approved while the UI said it failed").toBe(0);
  } else {
    expect(newPayments).toBe(1);
  }
});
