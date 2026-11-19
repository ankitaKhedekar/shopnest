// Seeds the database with an admin, a demo customer and sample products.
// Usage: npm run seed   (WARNING: wipes users, products and orders)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const products = [
  ['Aurora Wireless Headphones', 'Over-ear Bluetooth headphones with active noise cancelling and 40-hour battery life.', 129.99, 'Electronics', 25],
  ['Pulse Smartwatch', 'Fitness tracking, heart-rate monitor, GPS and a bright AMOLED display.', 189.0, 'Electronics', 12],
  ['Nimbus Portable Speaker', 'Waterproof speaker with deep bass and 360° sound. Pairs two for stereo.', 59.5, 'Electronics', 40],
  ['Volt 65W USB-C Charger', 'Compact GaN charger that powers a laptop, phone and earbuds at once.', 34.99, 'Electronics', 3],
  ['Everyday Canvas Backpack', 'Water-resistant canvas, padded 15" laptop sleeve and hidden back pocket.', 64.0, 'Accessories', 30],
  ['Classic Leather Wallet', 'Slim bifold wallet in full-grain leather with RFID blocking.', 39.0, 'Accessories', 50],
  ['Polarized Sunglasses', 'Lightweight frames with UV400 polarized lenses.', 49.99, 'Accessories', 18],
  ['Organic Cotton Tee', 'Soft, breathable 100% organic cotton crew-neck t-shirt.', 22.0, 'Clothing', 100],
  ['Trail Runner Sneakers', 'Grippy outsole, breathable mesh and a cushioned midsole for long runs.', 94.99, 'Clothing', 20],
  ['Merino Wool Hoodie', 'Temperature-regulating merino hoodie that resists odour.', 110.0, 'Clothing', 8],
  ['Ceramic Pour-Over Set', 'Hand-glazed dripper and carafe for a clean, bright cup of coffee.', 42.0, 'Home', 15],
  ['Linen Throw Blanket', 'Stonewashed linen throw that gets softer with every wash.', 79.0, 'Home', 10],
  ['Minimal Desk Lamp', 'Dimmable LED lamp with adjustable arm and USB charging port.', 55.0, 'Home', 22],
  ['Cast Iron Skillet 10"', 'Pre-seasoned skillet that goes from stovetop to oven to table.', 36.5, 'Home', 0],
  ['Atomic Habits (Paperback)', 'A practical guide to building good habits and breaking bad ones.', 16.99, 'Books', 60],
  ['The Pragmatic Programmer', 'Timeless advice for software developers, 20th anniversary edition.', 44.95, 'Books', 14],
].map(([name, description, price, category, stock], i) => ({
  name,
  description,
  price,
  category,
  stock,
  image: img(`shopnest-${i + 1}`),
}));

async function seed() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopnest');
  await Promise.all([Order.deleteMany(), Product.deleteMany(), User.deleteMany()]);

  await User.create([
    { name: 'Admin', email: 'admin@shopnest.dev', password: 'admin123', isAdmin: true },
    { name: 'Demo Customer', email: 'demo@shopnest.dev', password: 'demo123' },
  ]);
  await Product.insertMany(products);

  console.log(`Seeded ${products.length} products and 2 users.`);
  console.log('  Admin: admin@shopnest.dev / admin123');
  console.log('  User:  demo@shopnest.dev  / demo123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
