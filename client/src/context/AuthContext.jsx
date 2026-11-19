import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // Restore the session on page load
  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ user, token }) => {
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth);
  const register = (name, email, password) =>
    api('/auth/register', { method: 'POST', body: { name, email, password } }).then(handleAuth);
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
