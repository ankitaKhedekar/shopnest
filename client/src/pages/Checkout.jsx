import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import OrderSummary from './OrderSummary';

export default function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    card: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
  });

  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const submit = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const { fullName, address, city, postalCode, country } = form;
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: cart.items.map((i) => ({ product: i._id, qty: i.qty })),
          shippingAddress: { fullName, address, city, postalCode, country },
          card: { number: form.card },
        },
      });
      cart.clear();
      toast.success('Payment successful — order placed!');
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setPlacing(false);
    }
  };

  return (
    <>
      <h1>Checkout</h1>
      <form className="two-col" onSubmit={submit}>
        <div className="card form">
          <h3>Shipping address</h3>
          <label>Full name<input required value={form.fullName} onChange={set('fullName')} /></label>
          <label>Address<input required value={form.address} onChange={set('address')} /></label>
          <div className="form-row">
            <label>City<input required value={form.city} onChange={set('city')} /></label>
            <label>Postal code<input required value={form.postalCode} onChange={set('postalCode')} /></label>
          </div>
          <label>Country<input required value={form.country} onChange={set('country')} /></label>

          <h3>Payment <span className="tag tag-inline">Test mode</span></h3>
          <p className="small muted">No real charge. Any 16-digit number works; a card ending in 0000 is declined.</p>
          <label>
            Card number
            <input required inputMode="numeric" value={form.card} onChange={(e) => setForm({ ...form, card: formatCard(e.target.value) })} />
          </label>
          <div className="form-row">
            <label>Expiry<input required value={form.expiry} onChange={set('expiry')} placeholder="MM/YY" /></label>
            <label>CVC<input required value={form.cvc} onChange={set('cvc')} maxLength={4} /></label>
          </div>
        </div>
        <OrderSummary {...cart}>
          <button className="btn btn-block" disabled={placing}>{placing ? 'Processing…' : 'Pay & place order'}</button>
        </OrderSummary>
      </form>
    </>
  );
}
