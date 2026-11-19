import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, money } from '../api/client';
import { StatusPill } from './Orders';

const EMPTY = { name: '', description: '', price: '', category: '', image: '', stock: '' };
const STATUSES = ['Paid', 'Shipped', 'Delivered', 'Cancelled'];

export default function Admin() {
  const [tab, setTab] = useState('products');
  const [stats, setStats] = useState(null);

  const loadStats = () => api('/orders/admin/stats').then(setStats).catch(() => {});
  useEffect(() => { loadStats(); }, []);

  return (
    <>
      <h1>Admin dashboard</h1>
      {stats && (
        <div className="stats">
          <div className="card stat"><span className="muted small">Revenue</span><strong>{money(stats.revenue)}</strong></div>
          <div className="card stat"><span className="muted small">Orders</span><strong>{stats.orders}</strong></div>
          <div className="card stat">
            <span className="muted small">Low stock (≤5)</span>
            {stats.lowStock.length === 0 ? <span>All good</span> : stats.lowStock.map((p) => (
              <span key={p._id} className="small">{p.name}: <b className={p.stock === 0 ? 'danger' : ''}>{p.stock}</b></span>
            ))}
          </div>
        </div>
      )}
      <div className="chips">
        <button className={`chip ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`chip ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
      </div>
      {tab === 'products' ? <ProductsAdmin onChange={loadStats} /> : <OrdersAdmin onChange={loadStats} />}
    </>
  );
}

function ProductsAdmin({ onChange }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | product id
  const [form, setForm] = useState(EMPTY);

  const load = () => api('/products?limit=48&sort=newest').then((d) => setProducts(d.products));
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p ? p._id : 'new');
    setForm(p ? { ...p } : EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editing === 'new') await api('/products', { method: 'POST', body });
      else await api(`/products/${editing}`, { method: 'PUT', body });
      toast.success('Product saved');
      setEditing(null);
      load();
      onChange();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      load();
      onChange();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      {editing ? (
        <form className="card form" onSubmit={save}>
          <h3>{editing === 'new' ? 'New product' : 'Edit product'}</h3>
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <label>Description<textarea required rows={3} value={form.description} onChange={set('description')} /></label>
          <div className="form-row">
            <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} /></label>
            <label>Stock<input required type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></label>
            <label>Category<input required value={form.category} onChange={set('category')} /></label>
          </div>
          <label>Image URL<input required type="url" value={form.image} onChange={set('image')} /></label>
          <div className="buy-row">
            <button className="btn">Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn" onClick={() => startEdit(null)}>+ New product</button>
      )}
      <div className="card table-wrap">
        <table>
          <thead><tr><th /><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td><img className="thumb" src={p.image} alt="" /></td>
                <td><Link to={`/product/${p._id}`}>{p.name}</Link></td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td className={p.stock === 0 ? 'danger' : ''}>{p.stock}</td>
                <td className="actions">
                  <button className="link-btn" onClick={() => startEdit(p)}>Edit</button>
                  <button className="link-btn danger" onClick={() => del(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrdersAdmin({ onChange }) {
  const [orders, setOrders] = useState([]);
  const load = () => api('/orders').then(setOrders);
  useEffect(() => { load(); }, []);

  const setStatus = async (o, status) => {
    if (status === 'Cancelled' && !window.confirm('Cancel this order and restock its items?')) return;
    try {
      await api(`/orders/${o._id}/status`, { method: 'PUT', body: { status } });
      toast.success(`Order marked ${status}`);
      load();
      onChange();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (orders.length === 0) return <div className="center muted">No orders yet.</div>;
  return (
    <div className="card table-wrap">
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td className="mono"><Link to={`/orders/${o._id}`}>#{o._id.slice(-6).toUpperCase()}</Link></td>
              <td>{o.user?.name || 'Deleted user'}<br /><span className="muted small">{o.user?.email}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{money(o.totalPrice)}</td>
              <td><StatusPill status={o.status} /></td>
              <td>
                <select value={o.status} disabled={o.status === 'Cancelled'} onChange={(e) => setStatus(o, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
