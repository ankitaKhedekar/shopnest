import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { money } from '../api/client';
import { useCart } from '../context/CartContext';
import Stars from './Stars';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const out = product.stock === 0;

  return (
    <article className="card product-card">
      <Link to={`/product/${product._id}`} className="product-img">
        <img src={product.image} alt={product.name} loading="lazy" />
        {out && <span className="tag tag-dark">Sold out</span>}
        {!out && product.stock <= 5 && <span className="tag">Only {product.stock} left</span>}
      </Link>
      <div className="product-body">
        <span className="eyebrow">{product.category}</span>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>
        <Stars value={product.rating} count={product.numReviews} />
        <div className="product-foot">
          <strong>{money(product.price)}</strong>
          <button
            className="btn btn-sm"
            disabled={out}
            onClick={() => {
              add(product);
              toast.success(`${product.name} added to cart`);
            }}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
