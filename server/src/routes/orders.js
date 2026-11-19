import { Router } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();
const round2 = (n) => Math.round(n * 100) / 100;

export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FEE = 9.99;
export const TAX_RATE = 0.08;

// POST /api/orders  — prices are always recalculated on the server, never trusted from the client
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, card } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Cart is empty');

    // Mock payment: accept any 16-digit card number except one that ends in 0000
    const cardNumber = String(card?.number || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNumber)) throw new HttpError(400, 'Enter a valid 16-digit card number');
    if (cardNumber.endsWith('0000')) throw new HttpError(402, 'Payment declined (test card)');

    const ids = items.map((i) => i.product);
    if (!ids.every((id) => mongoose.isValidObjectId(id))) throw new HttpError(400, 'Invalid product in cart');
    const products = await Product.find({ _id: { $in: ids } });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = items.map(({ product, qty }) => {
      const p = byId.get(String(product));
      const quantity = Math.floor(Number(qty));
      if (!p) throw new HttpError(400, 'A product in your cart no longer exists');
      if (!(quantity >= 1)) throw new HttpError(400, `Invalid quantity for ${p.name}`);
      if (p.stock < quantity) throw new HttpError(400, `Only ${p.stock} left of ${p.name}`);
      return { product: p._id, name: p.name, image: p.image, price: p.price, qty: quantity };
    });

    // Reserve stock atomically; roll back if any item sold out in the meantime
    const decremented = [];
    for (const it of orderItems) {
      const ok = await Product.updateOne({ _id: it.product, stock: { $gte: it.qty } }, { $inc: { stock: -it.qty } });
      if (!ok.modifiedCount) {
        await Promise.all(decremented.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } })));
        throw new HttpError(409, `${it.name} just sold out`);
      }
      decremented.push(it);
    }

    const itemsPrice = round2(orderItems.reduce((s, i) => s + i.price * i.qty, 0));
    const shippingPrice = itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
    const taxPrice = round2(itemsPrice * TAX_RATE);

    try {
      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod: `Card •••• ${cardNumber.slice(-4)}`,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice: round2(itemsPrice + shippingPrice + taxPrice),
      });
      res.status(201).json(order);
    } catch (err) {
      await Promise.all(decremented.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } })));
      throw err;
    }
  })
);

router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) throw new HttpError(404, 'Order not found');
    if (!req.user.isAdmin && !order.user._id.equals(req.user._id)) throw new HttpError(404, 'Order not found');
    res.json(order);
  })
);

// ---- Admin ----
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    res.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
  })
);

router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status === 'Cancelled') throw new HttpError(400, 'Cancelled orders cannot be changed');
    if (status === 'Cancelled') {
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));
    }
    order.status = status;
    await order.save();
    res.json(order);
  })
);

router.get(
  '/admin/stats',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const [agg] = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    ]);
    const lowStock = await Product.find({ stock: { $lte: 5 } }).select('name stock').sort({ stock: 1 }).limit(5);
    res.json({ revenue: round2(agg?.revenue || 0), orders: agg?.orders || 0, lowStock });
  })
);

export default router;
