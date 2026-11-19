import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FREE_SHIPPING_OVER, SHIPPING_FEE, TAX_RATE } from '../api/client';

const CartContext = createContext(null);
const KEY = 'cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) =>
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) => (i._id === product._id ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i));
      }
      const { _id, name, price, image, stock } = product;
      return [...prev, { _id, name, price, image, stock, qty: Math.min(qty, stock) }];
    });

  const setQty = (id, qty) => setItems((prev) => prev.map((i) => (i._id === id ? { ...i, qty } : i)));
  const remove = (id) => setItems((prev) => prev.filter((i) => i._id !== id));
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const r = (n) => Math.round(n * 100) / 100;
    const itemsPrice = r(items.reduce((s, i) => s + i.price * i.qty, 0));
    const shipping = items.length === 0 || itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
    const tax = r(itemsPrice * TAX_RATE);
    return {
      count: items.reduce((s, i) => s + i.qty, 0),
      itemsPrice,
      shipping,
      tax,
      total: r(itemsPrice + shipping + tax),
    };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, ...totals }}>{children}</CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
