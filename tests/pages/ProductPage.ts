import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProductPage extends BasePage {
  readonly name: Locator;
  readonly stock: Locator;
  readonly quantitySelect: Locator;
  readonly addToCartButton: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId("product-name");
    this.stock = page.getByTestId("product-stock");
    this.quantitySelect = page.getByTestId("quantity-select");
    this.addToCartButton = page.getByTestId("add-to-cart");
    this.message = page.getByTestId("detail-message");
  }

  async goto(id: number) {
    await this.page.goto(`/product/${id}`);
    await this.name.waitFor();
  }

  async addToCart(quantity = 1) {
    await this.quantitySelect.selectOption(String(quantity));
    await this.addToCartButton.click();
  }

  /** Opens the product and adds `quantity` units in a single add. */
  async add(id: number, quantity = 1) {
    await this.goto(id);
    await this.addToCart(quantity);
  }
}
