import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney } from "../../../shared/money";
import { api, ApiError, type Order } from "../api";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import { useRouter } from "../router";

const PAYMENT_TIMEOUT_MS = 3000;

export function Checkout() {
  const { user, ready } = useAuth();
  const cart = useCart();
  const { navigate } = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate("/login?next=/checkout");
  }, [ready, user]);

  if (!ready || !user) return <p className="muted">Loading…</p>;
  if (cart.items.length === 0) return <p className="empty">There are no products to pay for.</p>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaying(true);
    try {
      const order = await api<Order>("/checkout", {
        method: "POST",
        timeoutMs: PAYMENT_TIMEOUT_MS,
        body: {
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          coupons: cart.coupons.map((c) => c.code),
          shipping: { name, address },
          card: { number: cardNumber },
        },
      });
      cart.clear();
      navigate(`/orders/${order.id}?new=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't process your payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="narrow">
      <h1>Checkout</h1>
      <p>Total to pay: <strong data-testid="checkout-total">{formatMoney(cart.totals.total)}</strong></p>
      <form onSubmit={submit} className="form">
        <label>
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} data-testid="shipping-name" />
        </label>
        <label>
          Shipping address
          <input value={address} onChange={(e) => setAddress(e.target.value)} data-testid="shipping-address" />
        </label>
        <label>
          Card number
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" placeholder="16 digits" data-testid="card-number" />
        </label>
        {error && <p className="error" data-testid="checkout-error">{error}</p>}
        <button className="primary" type="submit" disabled={paying} data-testid="pay-button">
          {paying ? "Processing…" : "Pay"}
        </button>
      </form>
    </section>
  );
}
