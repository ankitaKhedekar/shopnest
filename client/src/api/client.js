const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

// Must mirror the server constants in server/src/routes/orders.js
export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FEE = 9.99;
export const TAX_RATE = 0.08;
