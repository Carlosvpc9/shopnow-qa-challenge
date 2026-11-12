import type { APIRequestContext } from "@playwright/test";
import { CARDS, SHIPPING } from "../data/testData";

export interface CheckoutBody {
  items: { productId: number; quantity: number }[];
  coupons?: string[];
  shipping?: { name: string; address: string };
  card?: { number: string };
}

/** Thin client for the documented API (docs/API.md). Cookies (sid) are kept by the request context. */
export class ShopApi {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  login(user: { email: string; password: string }) {
    return this.request.post("/api/login", { data: user });
  }

  validateCoupon(code: string) {
    return this.request.post("/api/coupons/validate", { data: { code } });
  }

  checkout(body: CheckoutBody) {
    return this.request.post("/api/checkout", {
      data: { shipping: SHIPPING.valid, card: { number: CARDS.approved }, coupons: [], ...body },
    });
  }

  getProduct(id: number) {
    return this.request.get(`/api/products/${id}`);
  }

  getOrder(id: number) {
    return this.request.get(`/api/orders/${id}`);
  }

  getPayments() {
    return this.request.get("/api/payments");
  }
}
