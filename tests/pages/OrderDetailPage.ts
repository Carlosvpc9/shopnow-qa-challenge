import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderDetailPage extends BasePage {
  readonly success: Locator;
  readonly title: Locator;
  readonly date: Locator;
  readonly shipping: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.success = page.getByTestId("order-success");
    this.title = page.getByTestId("order-title");
    this.date = page.getByTestId("order-date");
    this.shipping = page.getByTestId("order-shipping");
    this.subtotal = page.getByTestId("order-subtotal");
    this.discount = page.getByTestId("order-discount");
    this.total = page.getByTestId("order-total");
    this.error = page.getByTestId("order-error");
  }

  async goto(id: number) {
    await this.page.goto(`/orders/${id}`);
    await this.title.or(this.error).waitFor();
  }
}
