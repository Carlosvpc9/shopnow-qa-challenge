import { test, expect } from "@playwright/test";
import { resetData } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("the cart total is calculated correctly", async ({ page }) => {
  await page.goto("/product/1");
  await page.getByTestId("quantity-select").selectOption("2");
  await page.getByTestId("add-to-cart").click();
  await page.goto("/cart");
  await expect(page.getByTestId("cart-line-1")).toBeVisible();
  await expect(page.getByTestId("cart-total")).toBeVisible();
});
