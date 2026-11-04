import { useEffect, useState } from "react";
import { formatMoney, lineTotal } from "../../../shared/money";
import { api, type Order } from "../api";
import { useAuth } from "../auth";
import { Link, useRouter } from "../router";

export function OrderDetail({ id }: { id: number }) {
  const { user, ready } = useAuth();
  const { path } = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isNew = path.includes("new=1");

  useEffect(() => {
    if (user) api<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [user, id]);

  if (ready && !user) return <p className="empty">Log in to see your orders.</p>;
  if (error) return <p className="error" data-testid="order-error">{error}</p>;
  if (!order) return <p className="muted">Loading…</p>;

  return (
    <section className="narrow">
      <Link to="/orders" className="back">← My orders</Link>
      {isNew && <p className="notice" data-testid="order-success">Thanks for your purchase! We sent you a confirmation email.</p>}
      <h1 data-testid="order-title">Order #{order.id}</h1>
      <p data-testid="order-date">Date: {order.displayDate} · {order.displayTime}</p>
      <p data-testid="order-shipping">Ship to: {order.shipping.name}, {order.shipping.address}</p>
      <table className="table">
        <tbody>
          {order.items.map((i) => (
            <tr key={i.productId}>
              <td>{i.name}</td>
              <td>{i.quantity} × {formatMoney(i.price)}</td>
              <td>{formatMoney(lineTotal(i.price, i.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Subtotal: <span data-testid="order-subtotal">{formatMoney(order.subtotal)}</span></p>
      {order.coupons.map((c) => (
        <p key={c.code} className="muted">Coupon {c.code} ({c.percent}%)</p>
      ))}
      <p>Discount: <span data-testid="order-discount">-{formatMoney(order.discount)}</span></p>
      <p className="total">Total: <span data-testid="order-total">{formatMoney(order.total)}</span></p>
    </section>
  );
}
