import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Coupon } from "../shared/money.js";

export interface User { id: number; name: string; email: string; password: string }
export interface Product { id: number; name: string; category: string; price: number; stock: number; description: string }
export interface OrderItem { productId: number; name: string; price: number; quantity: number }
export interface Order {
  id: number;
  userId: number;
  createdAt: string;
  items: OrderItem[];
  coupons: Coupon[];
  subtotal: number;
  discount: number;
  total: number;
  shipping: { name: string; address: string };
  paymentId: number;
}
export interface Payment { id: number; userId: number; orderId: number; amount: number; cardLast4: string; status: string; createdAt: string }
export interface Data { users: User[]; products: Product[]; orders: Order[]; payments: Payment[] }

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const seedFile = join(dataDir, "seed.json");
const dbFile = join(dataDir, "db.json");

export function resetData(): void {
  copyFileSync(seedFile, dbFile);
}

export function load(): Data {
  if (!existsSync(dbFile)) resetData();
  return JSON.parse(readFileSync(dbFile, "utf8")) as Data;
}

export function save(data: Data): void {
  writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}
