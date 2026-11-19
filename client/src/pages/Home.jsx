import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const [data, setData] = useState({ products: [], pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(search);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    api('/products/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ search, category, sort, page, limit: 12 });
    api(`/products?${qs}`)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  return (
    <>
      <section className="hero">
        <h1>Good things, delivered.</h1>
        <p className="muted">Free shipping on orders over $100. Thoughtfully chosen everyday goods.</p>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ search: query.trim() });
          }}
        >
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" />
          <button className="btn">Search</button>
        </form>
      </section>

      <div className="toolbar">
        <div className="chips">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => update({ category: '' })}>All</button>
          {categories.map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => update({ category: c })}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <div className="alert">Couldn't load products: {error}. Is the API running?</div>}
      {loading ? (
        <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="card skeleton" />)}</div>
      ) : data.products.length === 0 && !error ? (
        <div className="center muted">No products match “{search}”.</div>
      ) : (
        <div className="grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`chip ${n === page ? 'active' : ''}`} onClick={() => update({ page: String(n) })}>
              {n}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
