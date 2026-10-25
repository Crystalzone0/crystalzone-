import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ORDER_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

// Add a new value here (and a provider in services/payments) to support online payments later.
export const PAYMENT_METHODS = ['cod'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const money = { type: Number, required: true, min: 0 };

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = guest checkout

    customer: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      province: { type: String, required: true, trim: true, maxlength: 80 },
      postalCode: { type: String, trim: true, maxlength: 20, default: '' },
    },
    notes: { type: String, trim: true, maxlength: 500, default: '' },

    itemCount: { type: Number, required: true, min: 1 },
    subtotal: money, // sum of regular price x quantity
    discount: money, // sum of (regular - sale) x quantity
    shippingFee: money,
    total: money, // subtotal - discount + shippingFee (always calculated on the server)

    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cod' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paymentReference: { type: String, default: '' },

    status: { type: String, enum: ORDER_STATUSES, default: 'Order Placed' },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES, required: true },
        note: { type: String, default: '' },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        at: { type: Date, default: Date.now },
      },
    ],

    cancelReason: { type: String, default: '' },
    cancelledAt: { type: Date },
    deliveredAt: { type: Date },
    stockRestored: { type: Boolean, default: false }, // makes stock restoration on cancel idempotent
        // Random key the browser sends with a checkout. A retried request with the same key returns this order
    // instead of creating a second one.
    idempotencyKey: { type: String, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false }, toObject: { virtuals: true } }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'order',
});

orderSchema.pre('save', function seedHistory() {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status, note: 'Order placed by customer' });
  }
});

export default mongoose.model('Order', orderSchema);