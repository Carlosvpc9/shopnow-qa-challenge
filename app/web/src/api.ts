export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = options.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : undefined;
  try {
    const res = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
    return data as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface Product { id: number; name: string; category: string; price: number; stock: number; description: string }
export interface User { id: number; name: string; email: string }
export interface Order {
  id: number;
  items: { productId: number; name: string; price: number; quantity: number }[];
  coupons: { code: string; percent: number }[];
  subtotal: number;
  discount: number;
  total: number;
  shipping: { name: string; address: string };
  paymentId: number;
  displayDate: string;
  displayTime: string;
}
export interface Payment { id: number; orderId: number; amount: number; cardLast4: string; status: string; createdAt: string }
