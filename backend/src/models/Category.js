import mongoose from 'mongoose';
import { uniqueSlug } from '../utils/slug.js';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 60,
    },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

categorySchema.index({ sortOrder: 1, name: 1 });

categorySchema.pre('validate', async function generateSlug() {
  if (!this.slug && this.name) {
    this.slug = await uniqueSlug(this.constructor, this.name, this._id);
  }
});

export default mongoose.model('Category', categorySchema);