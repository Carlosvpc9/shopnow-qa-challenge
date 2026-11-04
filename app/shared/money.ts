export interface Coupon {
  code: string;
  percent: number;
}

export function lineTotal(price: number, quantity: number): number {
  return Math.floor(price * quantity * 100) / 100;
}

export function discountAmount(subtotal: number, percent: number): number {
  return Math.round(subtotal * percent) / 100;
}

export function cartTotals(
  lines: { price: number; quantity: number }[],
  coupons: Coupon[],
) {
  const subtotal = Math.round(lines.reduce((sum, l) => sum + lineTotal(l.price, l.quantity), 0) * 100) / 100;
  const discount = Math.round(coupons.reduce((sum, c) => sum + discountAmount(subtotal, c.percent), 0) * 100) / 100;
  const total = Math.round((subtotal - discount) * 100) / 100;
  return { subtotal, discount, total };
}

export function formatMoney(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
