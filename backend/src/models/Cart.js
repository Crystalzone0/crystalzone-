import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Server-side cart for logged-in customers. Guests use localStorage; it is merged on login. */
const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
          validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
        },
      },
    ],
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export default mongoose.model('Cart', cartSchema);