import { Link, useNavigate } from 'react-router-dom';
import { money, FREE_SHIPPING_OVER } from '../api/client';
import { useCart } from '../context/CartContext';
import OrderSummary from './OrderSummary';

export default function Cart() {
  const cart = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="center">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn">Start shopping</Link>
      </div>
    );
  }

  const toFree = FREE_SHIPPING_OVER - cart.itemsPrice;

  return (
    <>
      <h1>Shopping cart</h1>
      <div className="two-col">
        <div className="card">
          {cart.items.map((i) => (
            <div key={i._id} className="line">
              <img src={i.image} alt="" />
              <div className="line-info">
                <Link to={`/product/${i._id}`}>{i.name}</Link>
                <span className="muted small">{money(i.price)} each</span>
              </div>
              <select value={i.qty} onChange={(e) => cart.setQty(i._id, Number(e.target.value))} aria-label="Quantity">
                {Array.from({ length: Math.max(1, Math.min(i.stock, 10)) }, (_, n) => n + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <strong className="line-total">{money(i.price * i.qty)}</strong>
              <button className="icon-btn" onClick={() => cart.remove(i._id)} aria-label={`Remove ${i.name}`}>✕</button>
            </div>
          ))}
        </div>
        <OrderSummary {...cart}>
          {toFree > 0 && <p className="small muted">Add {money(toFree)} more for free shipping.</p>}
          <button className="btn btn-block" onClick={() => navigate('/checkout')}>Proceed to checkout</button>
        </OrderSummary>
      </div>
    </>
  );
}
