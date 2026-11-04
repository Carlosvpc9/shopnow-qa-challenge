import { useState } from "react";
import { formatMoney, lineTotal } from "../../../shared/money";
import { useCart } from "../cart";
import { Link, useRouter } from "../router";

export function Cart() {
  const cart = useCart();
  const { navigate } = useRouter();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return (
      <section>
        <h1>Cart</h1>
        <p className="empty" data-testid="cart-empty">Your cart is empty. <Link to="/">Browse products</Link></p>
      </section>
    );
  }

  const apply = async () => {
    setCouponError(null);
    try {
      await cart.applyCoupon(code);
      setCode("");
    } catch (e) {
      setCouponError((e as Error).message);
    }
  };

  return (
    <section>
      <h1>Cart</h1>
      <table className="table">
        <thead>
          <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          {cart.items.map((item) => (
            <tr key={item.productId} data-testid={`cart-line-${item.productId}`}>
              <td>{item.name}</td>
              <td>{formatMoney(item.price)}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => cart.updateQuantity(item.productId, Number(e.target.value))}
                  data-testid={`cart-qty-${item.productId}`}
                />
              </td>
              <td data-testid={`cart-line-total-${item.productId}`}>{formatMoney(lineTotal(item.price, item.quantity))}</td>
              <td>
                <button className="link-button" onClick={() => cart.remove(item.productId)} data-testid={`cart-remove-${item.productId}`}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="coupon">
        <input placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} data-testid="coupon-input" />
        <button onClick={apply} disabled={!code.trim()} data-testid="coupon-apply">Apply</button>
      </div>
      {couponError && <p className="error" data-testid="coupon-error">{couponError}</p>}
      {cart.coupons.map((c) => (
        <p key={c.code} className="notice" data-testid="coupon-applied">
          Coupon {c.code} applied ({c.percent}%).{" "}
          <button className="link-button" onClick={() => cart.removeCoupon(c.code)} data-testid="coupon-remove">Remove</button>
        </p>
      ))}

      <div className="cart-summary">
        <div className="totals">
          <p>Subtotal: <span data-testid="cart-subtotal">{formatMoney(cart.totals.subtotal)}</span></p>
          <p>Discount: <span data-testid="cart-discount">-{formatMoney(cart.totals.discount)}</span></p>
          <p className="total">Total: <span data-testid="cart-total">{formatMoney(cart.totals.total)}</span></p>
        </div>
        <button className="primary" onClick={() => navigate("/checkout")} data-testid="go-to-checkout">Go to checkout</button>
      </div>
    </section>
  );
}
