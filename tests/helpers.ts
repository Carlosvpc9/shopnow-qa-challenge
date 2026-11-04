import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const USERS = {
  ana: { email: "ana@shopnow.test", password: "Ana12345" },
  bruno: { email: "bruno@shopnow.test", password: "Bruno12345" },
};

/** Resets the app data to a fresh install (products, stock, sample orders and payments). */
export async function resetData(request: APIRequestContext) {
  const res = await request.post("/api/test/reset");
  expect(res.ok()).toBeTruthy();
}

export async function login(page: Page, user: { email: string; password: string } = USERS.ana) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(user.email);
  await page.getByTestId("login-password").fill(user.password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("logout")).toBeVisible();
}
