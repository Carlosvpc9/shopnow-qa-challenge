import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckoutPage extends BasePage {
  readonly total: Locator;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly cardInput: Locator;
  readonly payButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.total = page.getByTestId("checkout-total");
    this.nameInput = page.getByTestId("shipping-name");
    this.addressInput = page.getByTestId("shipping-address");
    this.cardInput = page.getByTestId("card-number");
    this.payButton = page.getByTestId("pay-button");
    this.error = page.getByTestId("checkout-error");
  }

  async goto() {
    await this.page.goto("/checkout");
    await this.payButton.waitFor();
  }

  async pay(shipping: { name: string; address: string }, cardNumber: string) {
    await this.nameInput.fill(shipping.name);
    await this.addressInput.fill(shipping.address);
    await this.cardInput.fill(cardNumber);
    await this.payButton.click();
  }
}
