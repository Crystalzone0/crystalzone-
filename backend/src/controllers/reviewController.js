import mongoose from 'mongoose';
import { Review, Order, OrderItem } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { buildPagination } from '../utils/pagination.js';
import { findVisibleProduct } from '../services/catalogVisibility.js';

/** "Sara Khan" -> "Sara K." (customers' full names are not shown publicly). */
function displayName(fullName) {
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** The customer's Delivered order that contains this product, if any. */
async function findPurchase(userId, productId) {
  const orderIds = await Order.distinct('_id', { user: userId, status: 'Delivered' });
  if (orderIds.length === 0) return null;
  return OrderItem.findOne({ order: { $in: orderIds }, product: productId }).select('order');
}

async function getEligibility(user, productId) {
  if (!user) return { canReview: false, reason: 'login' };
  if (await Review.exists({ product: productId, user: user._id })) {
    return { canReview: false, reason: 'already-reviewed' };
  }
  if (!(await findPurchase(user._id, productId))) return { canReview: false, reason: 'not-purchased' };
  return { canReview: true, reason: null };
}

// ------------------------------------------------------------------ public / customer

/** GET /api/products/:id/reviews: approved reviews, rating summary, and whether the visitor may review. */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const product = await findVisibleProduct(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const filter = { product: product._id, status: 'approved' };

  const [reviews, total, distributionRows, eligibility] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name rating comment createdAt'),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(product.id), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
    getEligibility(req.user, product._id),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of distributionRows) distribution[row._id] = row.count;

  res.json({
    success: true,
    reviews,
    pagination: buildPagination(page, limit, total),
    summary: { average: product.rating, count: product.reviewCount, distribution },
    eligibility,
  });
});

/** POST /api/products/:id/reviews: only customers whose order with this product was Delivered. */
export const createReview = asyncHandler(async (req, res) => {
  const product = await findVisibleProduct(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  if (await Review.exists({ product: product._id, user: req.user._id })) {
    throw new AppError('You have already reviewed this product', 409);
  }

  const purchase = await findPurchase(req.user._id, product._id);
  if (!purchase) {
    throw new AppError('Only customers who have received this product can review it', 403);
  }

  let review;
  try {
    review = await Review.create({
      product: product._id,
      user: req.user._id,
      order: purchase.order,
      name: displayName(req.user.name),
      rating: req.body.rating,
      comment: req.body.comment,
    }); // the model recalculates the product's average rating and review count
  } catch (err) {
    if (err.code === 11000) throw new AppError('You have already reviewed this product', 409);
    throw err;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your review!',
    review: {
      id: review.id,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    },
  });
});

// ------------------------------------------------------------------ admin

/** GET /api/admin/reviews */
export const listAdminReviews = asyncHandler(async (req, res) => {
  const { search, status, rating, page, limit } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (rating) filter.rating = rating;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ comment: rx }, { name: rx }];
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', 'name slug primaryImage')
      .populate('user', 'name email'),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, reviews, pagination: buildPagination(page, limit, total) });
});

/** PATCH /api/admin/reviews/:id  { status: "approved" | "hidden" } (moderation) */
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  review.status = req.body.status;
  await review.save(); // recalculates the product rating

  res.json({
    success: true,
    message: review.status === 'hidden' ? 'Review hidden' : 'Review approved',
    review,
  });
});

/** DELETE /api/admin/reviews/:id */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id }); // recalculates the product rating
  if (!review) throw new AppError('Review not found', 404);

  res.json({ success: true, message: 'Review deleted' });
});