export const PRODUCTS = {
  mug: { id: 1, name: "Ceramic mug", price: 8.35, stock: 25 },
  headphones: { id: 2, name: "Bluetooth headphones", price: 49.99, stock: 3 },
  tshirt: { id: 3, name: "Basic T-shirt", price: 14.35, stock: 40 },
  chair: { id: 8, name: "Ergonomic chair", price: 129, stock: 2 },
};

export const COUPONS = { flock10: "FLOCK10", bienvenida15: "BIENVENIDA15" };

export const CARDS = { approved: "4242424242424242", declined: "4242424242420000" };

export const SHIPPING = {
  valid: { name: "Ana Garcia", address: "1234 Corrientes Ave" },
  spanish: { name: "Ana García", address: "Av. Corrientes 1234, 3º B" },
};

/** Seed data after resetData(). */
export const SEED = {
  anaPaymentsCount: 2,
  brunoOrderId: 3,
  lateNightOrder: { id: 2, argentinaDate: "10/14/2026", argentinaTime: "23:30" },
};
