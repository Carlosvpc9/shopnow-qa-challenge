import { randomUUID } from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import { cartTotals, type Coupon } from "../shared/money.js";
import { load, nextId, resetData, save, type Order, type User } from "./db.js";

const COUPONS: Record<string, number> = {
  FLOCK10: 10,
  BIENVENIDA15: 15,
};

const TIME_ZONE = "America/Argentina/Buenos_Aires";
const sessions = new Map<string, number>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function findCoupon(code: string): Coupon | null {
  const typed = code.trim();
  const key = Object.keys(COUPONS).find((k) => k.toLowerCase() === typed.toLowerCase());
  if (!key) return null;
  return { code: typed, percent: COUPONS[typed] ?? 0 };
}

function formatOrderDate(iso: string) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const [year, month, day] = iso.slice(0, 10).split("-");
  const displayDate = `${month}/${day}/${year}`;
  return { displayDate, displayTime: time };
}

function presentOrder(order: Order) {
  return { ...order, ...formatOrderDate(order.createdAt) };
}

function currentUser(req: Request): User | null {
  const token = req.headers.cookie?.split(";").map((c) => c.trim()).find((c) => c.startsWith("sid="))?.slice(4);
  const userId = token ? sessions.get(token) : undefined;
  if (!userId) return null;
  return load().users.find((u) => u.id === userId) ?? null;
}

function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "You need to log in." });
    return;
  }
  res.locals.user = user;
  next();
}

export const api = Router();

api.post("/test/reset", (_req, res) => {
  resetData();
  res.json({ ok: true });
});

api.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = load().users.find((u) => u.email.toLowerCase() === String(email ?? "").trim().toLowerCase() && u.password === password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const token = randomUUID();
  sessions.set(token, user.id);
  res.setHeader("Set-Cookie", `sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
  res.json({ id: user.id, name: user.name, email: user.email });
});

api.post("/logout", (req, res) => {
  const token = req.headers.cookie?.split(";").map((c) => c.trim()).find((c) => c.startsWith("sid="))?.slice(4);
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "sid=; Path=/; Max-Age=0");
  res.json({ ok: true });
});

api.get("/me", (req, res) => {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Not logged in." });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

api.get("/products", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const category = String(req.query.category ?? "").trim();
  const products = load().products.filter(
    (p) => (!q || p.name.toLowerCase().includes(q)) && (!category || p.category === category),
  );
  res.json(products);
});

api.get("/products/:id", (req, res) => {
  const product = load().products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(product);
});

api.post("/coupons/validate", (req, res) => {
  const coupon = findCoupon(String(req.body?.code ?? ""));
  if (!coupon) {
    res.status(404).json({ error: "This coupon does not exist." });
    return;
  }
  res.json(coupon);
});

api.get("/orders", requireUser, (_req, res) => {
  const user = res.locals.user as User;
  const orders = load().orders.filter((o) => o.userId === user.id).sort((a, b) => b.id - a.id);
  res.json(orders.map(presentOrder));
});

api.get("/orders/:id", requireUser, (req, res) => {
  const user = res.locals.user as User;
  const order = load().orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json(presentOrder(order));
});

api.get("/payments", requireUser, (_req, res) => {
  const user = res.locals.user as User;
  const payments = load().payments.filter((p) => p.userId === user.id).sort((a, b) => b.id - a.id);
  res.json(payments);
});

api.post("/checkout", requireUser, async (req, res) => {
  const user = res.locals.user as User;
  const { items, coupons, shipping, card } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Your cart is empty." });
    return;
  }
  if (!shipping?.name?.trim() || !shipping?.address?.trim()) {
    res.status(400).json({ error: "Please fill in the shipping details." });
    return;
  }
  const SAFE_TEXT = /^[A-Za-z0-9 .,#/-]+$/;
  if (!SAFE_TEXT.test(shipping.name.trim()) || !SAFE_TEXT.test(shipping.address.trim())) {
    res.status(400).json({ error: "Please fill in the shipping details." });
    return;
  }
  const cardNumber = String(card?.number ?? "").replace(/\s/g, "");
  if (!/^\d{16}$/.test(cardNumber)) {
    res.status(400).json({ error: "The card number must have 16 digits." });
    return;
  }

  const data = load();
  const lines = [];
  for (const item of items) {
    const product = data.products.find((p) => p.id === Number(item.productId));
    if (!product) {
      res.status(400).json({ error: "One of the products no longer exists." });
      return;
    }
    const quantity = Number(item.quantity);
    lines.push({ productId: product.id, name: product.name, price: product.price, quantity });
  }

  const codes: string[] = Array.isArray(coupons) ? coupons.map(String) : [];
  const appliedCoupons: Coupon[] = [];
  for (const code of codes) {
    const coupon = findCoupon(code);
    if (!coupon) {
      res.status(400).json({ error: `Coupon ${code} does not exist.` });
      return;
    }
    appliedCoupons.push(coupon);
  }

  const totals = cartTotals(lines, appliedCoupons);

  await sleep(totals.total > 100 ? 4000 : 700);

  if (cardNumber.endsWith("0000")) {
    res.status(402).json({ error: "The payment was declined by the bank." });
    return;
  }

  const fresh = load();
  const now = new Date().toISOString();
  const orderId = nextId(fresh.orders);
  const paymentId = nextId(fresh.payments);
  fresh.payments.push({ id: paymentId, userId: user.id, orderId, amount: totals.total, cardLast4: cardNumber.slice(-4), status: "approved", createdAt: now });
  const order: Order = {
    id: orderId,
    userId: user.id,
    createdAt: now,
    items: lines,
    coupons: appliedCoupons,
    ...totals,
    shipping: { name: shipping.name.trim(), address: shipping.address.trim() },
    paymentId,
  };
  fresh.orders.push(order);
  for (const line of lines) {
    const product = fresh.products.find((p) => p.id === line.productId);
    if (product) product.stock -= line.quantity;
  }
  save(fresh);
  res.status(201).json(presentOrder(order));
});
