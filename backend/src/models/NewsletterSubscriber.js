import mongoose from 'mongoose';

const { Schema } = mongoose;

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    isActive: { type: Boolean, default: true },
    source: { type: String, default: 'website', maxlength: 40 },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

newsletterSubscriberSchema.index({ createdAt: -1 });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);