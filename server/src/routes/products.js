import { Router } from 'express';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1 },
};

// GET /api/products?search=&category=&sort=&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search = '', category = '', sort = 'newest' } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { description: rx }];
    }
    if (category) filter.category = category;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-reviews')
        .sort(SORTS[sort] || SORTS.newest)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ products, page, pages: Math.ceil(total / limit) || 1, total });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json((await Product.distinct('category')).sort());
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
  })
);

router.post(
  '/:id/reviews',
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');
    if (product.reviews.some((r) => r.user.equals(req.user._id))) {
      throw new HttpError(400, 'You have already reviewed this product');
    }
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.recalcRating();
    await product.save();
    res.status(201).json(product);
  })
);

// ---- Admin ----
const EDITABLE = ['name', 'description', 'price', 'category', 'image', 'stock'];
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    res.status(201).json(await Product.create(pick(req.body)));
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');
    res.json({ message: 'Product deleted' });
  })
);

export default router;
