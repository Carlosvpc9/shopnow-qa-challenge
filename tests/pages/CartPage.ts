import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  readonly empty: Locator;
  readonly couponInput: Locator;
  readonly couponApplyButton: Locator;
  readonly couponError: Locator;
  readonly appliedCoupons: Locator;
  readonly couponRemoveButton: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;
  readonly goToCheckoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.empty = page.getByTestId("cart-empty");
    this.couponInput = page.getByTestId("coupon-input");
    this.couponApplyButton = page.getByTestId("coupon-apply");
    this.couponError = page.getByTestId("coupon-error");
    this.appliedCoupons = page.getByTestId("coupon-applied");
    this.couponRemoveButton = page.getByTestId("coupon-remove");
    this.subtotal = page.getByTestId("cart-subtotal");
    this.discount = page.getByTestId("cart-discount");
    this.total = page.getByTestId("cart-total");
    this.goToCheckoutButton = page.getByTestId("go-to-checkout");
  }

  async goto() {
    await this.page.goto("/cart");
    await this.total.or(this.empty).waitFor();
  }

  line(productId: number) {
    return this.page.getByTestId(`cart-line-${productId}`);
  }

  quantityInput(productId: number) {
    return this.page.getByTestId(`cart-qty-${productId}`);
  }

  lineTotal(productId: number) {
    return this.page.getByTestId(`cart-line-total-${productId}`);
  }

  async setQuantity(productId: number, quantity: number) {
    await this.quantityInput(productId).fill(String(quantity));
  }

  async remove(productId: number) {
    await this.page.getByTestId(`cart-remove-${productId}`).click();
  }

  /** Types the code and clicks Apply. Waits until the coupon shows up as applied or an error appears. */
  async applyCoupon(code: string) {
    const appliedBefore = await this.appliedCoupons.count();
    await this.couponInput.fill(code);
    await this.couponApplyButton.click();
    await this.appliedCoupons.nth(appliedBefore).or(this.couponError).waitFor();
  }

  async goToCheckout() {
    await this.goToCheckoutButton.click();
  }
}
