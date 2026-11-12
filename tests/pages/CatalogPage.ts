import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CatalogPage extends BasePage {
  readonly message: Locator;

  constructor(page: Page) {
    super(page);
    this.message = page.getByTestId("catalog-message");
  }

  async goto() {
    await this.page.goto("/");
    await this.productCard(1).waitFor();
  }

  productCard(id: number) {
    return this.page.getByTestId(`product-card-${id}`);
  }

  quickAddButton(id: number) {
    return this.page.getByTestId(`quick-add-${id}`);
  }

  async quickAdd(id: number, times = 1) {
    for (let i = 0; i < times; i++) await this.quickAddButton(id).click();
  }
}
