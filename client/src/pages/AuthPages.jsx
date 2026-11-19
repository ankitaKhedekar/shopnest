import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      toast.success(`Welcome${isLogin ? ' back' : ''}, ${user.name}!`);
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1>{isLogin ? 'Sign in' : 'Create account'}</h1>
        {!isLogin && <label>Name<input required value={form.name} onChange={set('name')} /></label>}
        <label>Email<input required type="email" value={form.email} onChange={set('email')} /></label>
        <label>Password<input required type="password" minLength={6} value={form.password} onChange={set('password')} /></label>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        {isLogin ? (
          <>
            <p className="small">New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
            <div className="demo-box small">
              <strong>Demo accounts</strong>
              <button type="button" className="link-btn" onClick={() => setForm({ ...form, email: 'demo@shopnest.dev', password: 'demo123' })}>Customer</button>
              <button type="button" className="link-btn" onClick={() => setForm({ ...form, email: 'admin@shopnest.dev', password: 'admin123' })}>Admin</button>
            </div>
          </>
        ) : (
          <p className="small">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
        )}
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
