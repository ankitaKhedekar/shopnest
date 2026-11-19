import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.methods.recalcRating = function recalcRating() {
  this.numReviews = this.reviews.length;
  this.rating = this.numReviews
    ? Math.round((this.reviews.reduce((s, r) => s + r.rating, 0) / this.numReviews) * 10) / 10
    : 0;
};

export default mongoose.model('Product', productSchema);
