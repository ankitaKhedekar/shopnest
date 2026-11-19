import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          Shop<span>Nest</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Shop</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/cart" className="cart-link">
            Cart{count > 0 && <span className="badge">{count}</span>}
          </NavLink>
          {user ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="btn btn-sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
