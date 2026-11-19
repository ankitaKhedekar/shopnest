# ShopNest: a MERN e-commerce store

ShopNest is a full-stack online store built with **MongoDB, Express, React and Node.js**. Customers can browse, search, review and buy products. Admins manage the catalogue and fulfil orders from a dashboard.

## Features

**Customers**
- Product catalogue with search, category filters, sorting and pagination
- Product pages with stock levels, star ratings and reviews (one per user)
- Cart saved in the browser, with live subtotal, shipping and tax
- Checkout with a simulated card payment
- Order history and order detail pages
- JWT sign-up and login that survive a page reload

**Admins**
- Dashboard showing revenue, order count and low-stock alerts
- Create, edit and delete products
- Move orders through Paid → Shipped → Delivered, or cancel them (cancelling puts the stock back)

**Engineering details worth mentioning in interviews**
- The server recalculates every price. The client only sends product IDs and quantities, so nobody can edit a price in DevTools.
- Stock is decremented atomically (`updateOne` with a `stock >= qty` condition). If one item in an order sells out partway through, the stock already taken is put back.
- Passwords are hashed with bcrypt and never returned by the API (`select: false`).
- One error handler turns Mongoose validation, cast and duplicate-key errors into clean JSON responses.
- Role-based access (`protect` and `adminOnly` middleware) on the API, and matching route guards in React.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, React Router 6, Vite, Context API, react-hot-toast, plain CSS |
| Backend  | Node.js, Express 4, JWT, bcryptjs |
| Database | MongoDB with Mongoose 8 |

## Project structure

```
shopnest/
├── server/
│   └── src/
│       ├── config/db.js          # Mongo connection
│       ├── models/               # User, Product (with reviews), Order
│       ├── middleware/           # auth (JWT, admin) + error handling
│       ├── routes/               # auth, products, orders
│       ├── app.js                # Express app
│       ├── index.js              # entry point
│       └── seed.js               # sample data
├── client/
│   └── src/
│       ├── api/client.js         # fetch wrapper + helpers
│       ├── context/              # AuthContext, CartContext
│       ├── components/           # Navbar, ProductCard, Stars
│       └── pages/                # Home, Product, Cart, Checkout, Orders, Admin…
└── docker-compose.yml            # local MongoDB
```

## Getting started

**What you need:** Node.js 18 or newer, plus MongoDB. Any of these works for MongoDB:
- Docker: `docker compose up -d`
- A local MongoDB install
- A free MongoDB Atlas cluster (put its connection string in `MONGO_URI`)

```bash
# 1. Install dependencies for the root, server and client
npm run install:all

# 2. Configure the API
cp server/.env.example server/.env      # then set JWT_SECRET (and MONGO_URI if using Atlas)

# 3. Start MongoDB (skip if using Atlas or a local install)
docker compose up -d

# 4. Load sample products and demo users
npm run seed

# 5. Run the API (port 5000) and the React app (port 5173) together
npm run dev
```

Open http://localhost:5173.

### Demo accounts (created by the seed script)
| Role     | Email               | Password |
|----------|---------------------|----------|
| Admin    | admin@shopnest.dev  | admin123 |
| Customer | demo@shopnest.dev   | demo123  |

**Test payments:** any 16-digit card number goes through. A number ending in `0000` is declined, so you can see the error path.

## API reference

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in, returns a JWT |
| GET | `/api/auth/me` | User | Current user |
| GET | `/api/products?search=&category=&sort=&page=` | Public | List products |
| GET | `/api/products/categories` | Public | Distinct categories |
| GET | `/api/products/:id` | Public | Product with reviews |
| POST | `/api/products/:id/reviews` | User | Add a review |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |
| POST | `/api/orders` | User | Place an order (mock payment) |
| GET | `/api/orders/mine` | User | My orders |
| GET | `/api/orders/:id` | Owner/Admin | Order detail |
| GET | `/api/orders` | Admin | All orders |
| PUT | `/api/orders/:id/status` | Admin | Update status |
| GET | `/api/orders/admin/stats` | Admin | Revenue, order count, low stock |

Protected routes expect the header `Authorization: Bearer <token>`.

## Deployment

1. **Database:** create a free MongoDB Atlas cluster and copy its connection string.
2. **API:** deploy `server/` to Render or Railway. Start command: `npm start`. Set these environment variables: `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` (your frontend URL).
3. **Frontend:** deploy `client/` to Vercel or Netlify. Build command: `npm run build`. Output folder: `dist`. Set `VITE_API_URL` to your API URL. For client-side routing, add a rewrite so every path serves `index.html` (on Vercel, a `vercel.json` rewrite; on Netlify, a `_redirects` file containing `/* /index.html 200`).
4. Run the seed once against Atlas: `MONGO_URI=... npm run seed --prefix server`.

## Ideas for extending it
- Real payments with Stripe Checkout
- Image uploads with Cloudinary or S3, instead of image URLs
- Wishlist, coupon codes, email receipts
- API tests with Jest, Supertest and mongodb-memory-server

Product images are placeholder photos from picsum.photos. Swap them for real product photos from the admin panel.
