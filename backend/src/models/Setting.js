import mongoose from 'mongoose';
import { env } from '../config/env.js';

const { Schema } = mongoose;

/** Single-document store settings, editable in Admin > Settings. */
const settingSchema = new Schema(
  {
    key: { type: String, default: 'store', unique: true },
    storeName: { type: String, default: 'Crystal Zone', trim: true, maxlength: 80 },
    tagline: {
      type: String,
      default: 'Artificial Jewellery & Fashion Accessories',
      trim: true,
      maxlength: 160,
    },
    phone: { type: String, default: env.STORE_PHONE, trim: true },
    whatsappNumber: { type: String, default: env.WHATSAPP_NUMBER, trim: true },
    email: { type: String, default: env.STORE_EMAIL, trim: true },
    address: { type: String, default: '', trim: true, maxlength: 300 },
    currency: { type: String, default: env.CURRENCY, trim: true, maxlength: 5 },
    shippingFee: { type: Number, default: env.SHIPPING_FEE, min: 0 },
    freeShippingThreshold: { type: Number, default: env.FREE_SHIPPING_THRESHOLD, min: 0 },
    lowStockThreshold: { type: Number, default: env.LOW_STOCK_THRESHOLD, min: 0 },
    announcement: { type: String, default: '', trim: true, maxlength: 200 },
    socials: {
      instagram: { type: String, default: '', trim: true },
      facebook: { type: String, default: '', trim: true },
      tiktok: { type: String, default: '', trim: true },
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

/** Returns the store settings, creating the document with env defaults on first use. */
settingSchema.statics.getStore = async function getStore() {
  const existing = await this.findOne({ key: 'store' });
  if (existing) return existing;

  try {
    return await this.create({ key: 'store' });
  } catch (err) {
    // Two requests raced to create it: the unique index rejected the second one.
    if (err.code === 11000) return this.findOne({ key: 'store' });
    throw err;
  }
};

export default mongoose.model('Setting', settingSchema);