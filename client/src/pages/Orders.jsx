import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api/client';

export const StatusPill = ({ status }) => <span className={`pill pill-${status.toLowerCase()}`}>{status}</span>;

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders/mine').then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!orders) return <div className="center muted">Loading…</div>;

  return (
    <>
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <div className="center muted">No orders yet. <Link to="/">Go shopping</Link></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="mono">#{o._id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td>{money(o.totalPrice)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td><Link to={`/orders/${o._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
