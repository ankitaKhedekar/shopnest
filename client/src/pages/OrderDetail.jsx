import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../api/client';
import { StatusPill } from './Orders';
import OrderSummary from './OrderSummary';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="alert">{error}</div>;
  if (!order) return <div className="center muted">Loading…</div>;

  const a = order.shippingAddress;
  return (
    <>
      <Link to="/orders" className="back">← All orders</Link>
      <h1>
        Order #{order._id.slice(-6).toUpperCase()} <StatusPill status={order.status} />
      </h1>
      <p className="muted">Placed {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod}</p>
      <div className="two-col">
        <div>
          <div className="card">
            {order.items.map((i) => (
              <div key={i.product} className="line">
                <img src={i.image} alt="" />
                <div className="line-info">
                  <Link to={`/product/${i.product}`}>{i.name}</Link>
                  <span className="muted small">{i.qty} × {money(i.price)}</span>
                </div>
                <strong className="line-total">{money(i.qty * i.price)}</strong>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Shipping to</h3>
            <p>{a.fullName}<br />{a.address}<br />{a.city} {a.postalCode}<br />{a.country}</p>
          </div>
        </div>
        <OrderSummary itemsPrice={order.itemsPrice} shipping={order.shippingPrice} tax={order.taxPrice} total={order.totalPrice} />
      </div>
    </>
  );
}
