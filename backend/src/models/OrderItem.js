import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * One row per product in an order. Name, SKU, image and prices are SNAPSHOTS:
 * later edits to the product never change what a customer already bought.
 */
const orderItemSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, default: '' },
    sku: { type: String, required: true },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 }, // regular price at purchase time
    paidPrice: { type: Number, required: true, min: 0 }, // price actually charged per unit
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    lineTotal: { type: Number, required: true, min: 0 }, // paidPrice x quantity
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

orderItemSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('OrderItem', orderItemSchema);