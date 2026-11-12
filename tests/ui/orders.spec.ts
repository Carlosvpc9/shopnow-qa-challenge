import { test, expect } from "../fixtures";
import { login, resetData, USERS } from "../helpers";
import { SEED } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-04] a user cannot open another user's order in the UI", async ({ page, orderDetailPage }) => {
  await login(page, USERS.ana);
  await orderDetailPage.goto(SEED.brunoOrderId);

  await expect(orderDetailPage.error).toBeVisible();
  await expect(orderDetailPage.shipping).toHaveCount(0);
});

test("[BUG-10] the order date is shown in Argentina time, same as the order time", async ({ page, orderDetailPage }) => {
  await login(page, USERS.ana);
  await orderDetailPage.goto(SEED.lateNightOrder.id); // created 2026-10-15T02:30Z

  await expect(orderDetailPage.date).toContainText(SEED.lateNightOrder.argentinaDate);
  await expect(orderDetailPage.date).toContainText(SEED.lateNightOrder.argentinaTime);
});
