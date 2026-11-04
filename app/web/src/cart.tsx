import { createContext, useContext, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cartTotals, type Coupon } from "../../shared/money";
import { api, type Product } from "./api";

export interface CartItem { productId: number; name: string; price: number; stock: number; quantity: number }
interface StoredCart { items: CartItem[]; coupons: Coupon[] }

const STORAGE_KEY = "shopnow.cart";

function readStoredCart(): StoredCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredCart;
  } catch {
    // ignore corrupted storage
  }
  return { items: [], coupons: [] };
}

function writeStoredCart(cart: StoredCart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function mergeItem(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const existing = items.find((i) => i.productId === product.id);
  if (existing) {
    return items.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity, stock: product.stock } : i));
  }
  return [...items, { productId: product.id, name: product.name, price: product.price, stock: product.stock, quantity }];
}

interface CartContextValue {
  items: CartItem[];
  coupons: Coupon[];
  setItems: Dispatch<SetStateAction<CartItem[]>>;
  add: (product: Product, quantity: number) => string | null;
  updateQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => void;
  clear: () => void;
  totals: { subtotal: number; discount: number; total: number };
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const initial = useRef(readStoredCart()).current;
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [coupons, setCoupons] = useState<Coupon[]>(initial.coupons);
  const couponAppliedRef = useRef(false);

  const persist = (nextItems: CartItem[], nextCoupons: Coupon[]) => {
    setItems(nextItems);
    setCoupons(nextCoupons);
    writeStoredCart({ items: nextItems, coupons: nextCoupons });
  };

  const add = (product: Product, quantity: number): string | null => {
    if (quantity < 1) {
      return "Choose at least one unit.";
    }
    persist(mergeItem(items, product, quantity), coupons);
    return null;
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const safe = Math.max(1, Math.floor(quantity) || 1);
    persist(items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(safe, i.stock) } : i)), coupons);
  };

  const remove = (productId: number) => {
    const nextItems = items.filter((i) => i.productId !== productId);
    persist(nextItems, nextItems.length === 0 ? [] : coupons);
  };

  const applyCoupon = async (code: string) => {
    if (couponAppliedRef.current) {
      throw new Error("Only one coupon can be used per purchase.");
    }
    const coupon = await api<Coupon>("/coupons/validate", { method: "POST", body: { code } });
    couponAppliedRef.current = true;
    persist(items, [...coupons, coupon]);
  };

  const removeCoupon = (code: string) => {
    couponAppliedRef.current = false;
    persist(items, coupons.filter((c) => c.code !== code));
  };

  const clear = () => {
    couponAppliedRef.current = false;
    persist([], []);
  };

  const totals = cartTotals(items, coupons);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, coupons, setItems, add, updateQuantity, remove, applyCoupon, removeCoupon, clear, totals, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
