import { test, expect } from "../fixtures";
import { resetData, USERS } from "../helpers";
import { SEED } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test("[BUG-04] the API does not return another user's order", async ({ api }) => {
  await api.login(USERS.ana);
  const res = await api.getOrder(SEED.brunoOrderId);
  expect(res.status()).toBe(404);
});

test("[BUG-10] the API returns the order date in Argentina time", async ({ api }) => {
  await api.login(USERS.ana);
  const order = await (await api.getOrder(SEED.lateNightOrder.id)).json();
  expect(order.displayDate).toBe(SEED.lateNightOrder.argentinaDate);
  expect(order.displayTime).toBe(SEED.lateNightOrder.argentinaTime);
});
