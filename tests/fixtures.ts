import { test as base } from "@playwright/test";
import { ShopApi } from "./support/ShopApi";
import { CartPage } from "./pages/CartPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { ProductPage } from "./pages/ProductPage";

interface ShopFixtures {
  api: ShopApi;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderDetailPage: OrderDetailPage;
}

export const test = base.extend<ShopFixtures>({
  api: async ({ request }, use) => use(new ShopApi(request)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  orderDetailPage: async ({ page }, use) => use(new OrderDetailPage(page)),
});

export { expect } from "@playwright/test";
