import { test, expect } from "@playwright/test";
import { login, resetData } from "../helpers";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[EXAMPLE] a test user can log in", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("nav-orders")).toBeVisible();
});
