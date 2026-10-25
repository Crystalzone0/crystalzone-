import mongoose from 'mongoose';
import Product from './Product.js';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, // proves the purchase
    name: { type: String, required: true, trim: true, maxlength: 80 }, // display-name snapshot
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: { validator: Number.isInteger, message: 'Rating must be a whole number' },
    },
    comment: {
      type: String,
      required: [true, 'Please write a short review'],
      trim: true,
      minlength: [3, 'Review is too short'],
      maxlength: [1000, 'Review must be at most 1000 characters'],
    },
    status: { type: String, enum: ['approved', 'hidden'], default: 'approved' },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // one review per product per customer
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

/** Recomputes Product.rating and Product.reviewCount from approved reviews. */
reviewSchema.statics.calcAverage = async function calcAverage(productId) {
  const id = new mongoose.Types.ObjectId(productId);
  const [stats] = await this.aggregate([
    { $match: { product: id, status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(id, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

// Use review.save() for create/moderation and findOneAndDelete() for removal so these fire.
reviewSchema.post('save', async function afterSave() {
  await this.constructor.calcAverage(this.product);
});

reviewSchema.post('findOneAndDelete', async function afterDelete(doc) {
  if (doc) await doc.constructor.calcAverage(doc.product);
});

export default mongoose.model('Review', reviewSchema);