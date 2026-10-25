import { Review, Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildFilter } from '../services/productService.js';

/**
 * GET /api/reviews/featured
 * The latest approved 4 and 5 star reviews, only for products a shopper can actually open.
 * Used by the home page "Customer Reviews" section (empty list = the section is hidden).
 */
export const getFeaturedReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find({ status: 'approved', rating: { $gte: 4 } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(30)
    .select('name rating comment createdAt product');

  const productIds = [...new Set(reviews.map((r) => String(r.product)))];
  const visibleFilter = await buildFilter({});
  const products = await Product.find({ ...visibleFilter, _id: { $in: productIds } }).select('name slug');
  const byId = new Map(products.map((p) => [p.id, p]));

  const featured = reviews
    .filter((r) => byId.has(String(r.product)))
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      product: { name: byId.get(String(r.product)).name, slug: byId.get(String(r.product)).slug },
    }));

  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, reviews: featured });
});