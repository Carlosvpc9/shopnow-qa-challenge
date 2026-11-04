import { useEffect, useState } from "react";
import { formatMoney } from "../../../shared/money";
import { api, type Order } from "../api";
import { useAuth } from "../auth";
import { Link } from "../router";

export function Orders() {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (user) api<Order[]>("/orders").then(setOrders);
  }, [user]);

  if (ready && !user) return <p className="empty">Log in to see your orders.</p>;
  if (!orders) return <p className="muted">Loading…</p>;

  return (
    <section>
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <p className="empty">You have no orders yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} data-testid={`order-row-${o.id}`}>
                <td><Link to={`/orders/${o.id}`} data-testid={`order-link-${o.id}`}>#{o.id}</Link></td>
                <td>{o.displayDate}</td>
                <td>{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
