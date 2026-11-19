import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, money } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Stars from '../components/Stars';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    api(`/products/${id}`).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="center"><h2>{error}</h2><Link to="/">Back to shop</Link></div>;
  if (!product) return <div className="center muted">Loading…</div>;

  const out = product.stock === 0;
  const alreadyReviewed = user && product.reviews.some((r) => r.user === user._id);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      setProduct(await api(`/products/${id}/reviews`, { method: 'POST', body: review }));
      setReview({ rating: 5, comment: '' });
      toast.success('Thanks for your review!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Link to="/" className="back">← Back to shop</Link>
      <div className="detail">
        <img className="detail-img" src={product.image} alt={product.name} />
        <div>
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <Stars value={product.rating} count={product.numReviews} />
          <p className="price">{money(product.price)}</p>
          <p>{product.description}</p>
          <p className={out ? 'danger' : 'muted'}>{out ? 'Out of stock' : `${product.stock} in stock`}</p>
          {!out && (
            <div className="buy-row">
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantity">
                {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button className="btn" onClick={() => { add(product, qty); toast.success('Added to cart'); }}>
                Add to cart
              </button>
              <button className="btn btn-ghost" onClick={() => { add(product, qty); navigate('/cart'); }}>
                Buy now
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="reviews">
        <h2>Reviews</h2>
        {product.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
        {product.reviews.map((r) => (
          <div key={r._id} className="review">
            <strong>{r.name}</strong> <Stars value={r.rating} />
            <p>{r.comment}</p>
            <span className="muted small">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
        ))}

        {!user && <p className="muted"><Link to={`/login?next=/product/${id}`}>Sign in</Link> to write a review.</p>}
        {user && !alreadyReviewed && (
          <form className="card form" onSubmit={submitReview}>
            <h3>Write a review</h3>
            <label>
              Rating
              <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} – {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n]}</option>)}
              </select>
            </label>
            <label>
              Comment
              <textarea required rows={3} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
            </label>
            <button className="btn">Submit review</button>
          </form>
        )}
      </section>
    </>
  );
}
