import mongoose from 'mongoose';
import { uniqueSlug } from '../utils/slug.js';

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public_id, used for deletion
  },
  { _id: false }
);

const specSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 4000,
    },
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be at least 1'] },
    salePrice: {
      type: Number,
      min: [1, 'Sale price must be at least 1'],
      default: null,
      validate: {
        validator(value) {
          return value == null || value < this.price;
        },
        message: 'Sale price must be lower than the regular price',
      },
    },
    // Percentage, computed automatically from price and salePrice.
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // What the customer actually pays (salePrice when set, otherwise price).
    // Stored so price filtering and price sorting are indexed and always correct.
    finalPrice: { type: Number, default: 0, min: 0 },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 40,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'Stock must be a whole number' },
    },
    images: { type: [imageSchema], default: [] }, // order = display order
    primaryImage: { type: String, default: '' }, // always one of images[].url
    tags: [{ type: String, lowercase: true, trim: true, maxlength: 40 }],
    specifications: { type: [specSchema], default: [] },

    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // false = hidden from the store

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 }, // drives "popularity" sorting
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false }, toObject: { virtuals: true } }
);

productSchema.index({ isActive: 1, category: 1, finalPrice: 1 });
productSchema.index({ isActive: 1, finalPrice: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, soldCount: -1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ bestSeller: 1, isActive: 1 });
productSchema.index({ newArrival: 1, isActive: 1 });
productSchema.index({ stock: 1 });

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.salePrice != null && this.salePrice < this.price ? this.salePrice : this.price;
});

// NOTE: update products with doc.set(...) + doc.save() so these hooks and validators run.
productSchema.pre('validate', async function prepare() {
  // Slug is generated once. Renaming a product keeps its URL stable for SEO.
  if (!this.slug && this.name) {
    this.slug = await uniqueSlug(this.constructor, this.name, this._id);
  }

  // Discount percentage and final price always match the entered prices.
  if (this.salePrice != null && this.price > 0 && this.salePrice < this.price) {
    this.discount = Math.round(((this.price - this.salePrice) / this.price) * 100);
    this.finalPrice = this.salePrice;
  } else {
    this.discount = 0;
    this.finalPrice = this.price;
  }

  // The primary image must always be one of the product's images.
  const urls = this.images.map((img) => img.url);
  if (urls.length === 0) this.primaryImage = '';
  else if (!this.primaryImage || !urls.includes(this.primaryImage)) this.primaryImage = urls[0];

  this.tags = [...new Set(this.tags)];
});

export default mongoose.model('Product', productSchema);