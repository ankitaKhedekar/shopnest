import { money } from '../api/client';

export default function OrderSummary({ itemsPrice, shipping, tax, total, children }) {
  return (
    <aside className="card summary">
      <h3>Order summary</h3>
      <div className="row"><span>Items</span><span>{money(itemsPrice)}</span></div>
      <div className="row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : money(shipping)}</span></div>
      <div className="row"><span>Tax (8%)</span><span>{money(tax)}</span></div>
      <div className="row total"><span>Total</span><span>{money(total)}</span></div>
      {children}
    </aside>
  );
}
