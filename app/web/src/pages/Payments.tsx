import { useEffect, useState } from "react";
import { formatMoney } from "../../../shared/money";
import { api, type Payment } from "../api";
import { useAuth } from "../auth";
import { Link } from "../router";

export function Payments() {
  const { user, ready } = useAuth();
  const [payments, setPayments] = useState<Payment[] | null>(null);

  useEffect(() => {
    if (user) api<Payment[]>("/payments").then(setPayments);
  }, [user]);

  if (ready && !user) return <p className="empty">Log in to see your payments.</p>;
  if (!payments) return <p className="muted">Loading…</p>;

  return (
    <section>
      <h1>My payments</h1>
      {payments.length === 0 ? (
        <p className="empty">No payments yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Payment</th><th>Order</th><th>Card</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} data-testid={`payment-row-${p.id}`}>
                <td>#{p.id}</td>
                <td><Link to={`/orders/${p.orderId}`}>#{p.orderId}</Link></td>
                <td>•••• {p.cardLast4}</td>
                <td data-testid={`payment-amount-${p.id}`}>{formatMoney(p.amount)}</td>
                <td>{p.status === "approved" ? "Approved" : p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
