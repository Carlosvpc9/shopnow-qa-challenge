import type { Locator, Page } from "@playwright/test";

/** Header shared by every screen. */
export class BasePage {
  readonly page: Page;
  readonly navCart: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navCart = page.getByTestId("nav-cart");
    this.logoutButton = page.getByTestId("logout");
  }

  async reload() {
    await this.page.reload();
  }
}
