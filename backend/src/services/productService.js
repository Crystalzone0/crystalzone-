import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { escapeRegex } from '../utils/text.js';
import { isObjectId } from '../middleware/validateObjectId.js';

export const CATEGORY_POPULATE = { path: 'category', select: 'name slug' };

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  'price-asc': { finalPrice: 1, _id: 1 },
  'price-desc': { finalPrice: -1, _id: 1 },
  popular: { soldCount: -1, rating: -1, createdAt: -1, _id: -1 },
  rating: { rating: -1, reviewCount: -1, _id: -1 },
  'name-asc': { name: 1, _id: 1 },
};

export const buildSort = (sort = 'newest') => SORTS[sort] || SORTS.newest;

/** "rings,earrings" or ids -> array of category ids (unknown values simply match nothing). */
async function resolveCategoryIds(value) {
  const parts = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const ids = parts.filter(isObjectId);
  const slugs = parts.filter((p) => !isObjectId(p)).map((s) => s.toLowerCase());

  if (slugs.length) {
    const found = await Category.find({ slug: { $in: slugs } }).select('_id');
    ids.push(...found.map((c) => c._id.toString()));
  }
  return ids;
}

/**
 * Builds the MongoDB filter for the catalog.
 * Public: only active products whose category is not hidden.
 * Admin:  everything, optionally narrowed by status / stockStatus.
 */
export async function buildFilter(params = {}, { admin = false, lowStockThreshold = 5 } = {}) {
  const filter = {};
  const and = [];

  if (!admin) {
    filter.isActive = true;
    const hiddenCategories = await Category.distinct('_id', { isActive: false });
    if (hiddenCategories.length) and.push({ category: { $nin: hiddenCategories } });
  } else if (params.status) {
    filter.isActive = params.status === 'active';
  }

  if (params.category) {
    const ids = await resolveCategoryIds(params.category);
    and.push({ category: { $in: ids } }); // empty list = unknown category = no results
  }

  // Every search word must match name, SKU, tag, description or category name.
  if (params.q) {
    const words = params.q.split(/\s+/).filter(Boolean).slice(0, 6);
    if (words.length) {
      const categories = await Category.find({}).select('name').lean();
      for (const word of words) {
        const rx = new RegExp(escapeRegex(word), 'i');
        const matchingCategoryIds = categories.filter((c) => rx.test(c.name)).map((c) => c._id);
        and.push({
          $or: [
            { name: rx },
            { sku: rx },
            { tags: rx },
            { description: rx },
            ...(matchingCategoryIds.length ? [{ category: { $in: matchingCategoryIds } }] : []),
          ],
        });
      }
    }
  }

  if (params.minPrice != null || params.maxPrice != null) {
    filter.finalPrice = {};
    if (params.minPrice != null) filter.finalPrice.$gte = params.minPrice;
    if (params.maxPrice != null) filter.finalPrice.$lte = params.maxPrice;
  }

  if (params.onSale) filter.discount = { $gt: 0 };
  if (params.featured) filter.featured = true;
  if (params.bestSeller) filter.bestSeller = true;
  if (params.newArrival) filter.newArrival = true;

  // Availability (public) and stockStatus (admin) both act on stock.
  if (params.availability === 'in-stock' || params.stockStatus === 'in') filter.stock = { $gt: 0 };
  if (params.availability === 'out-of-stock' || params.stockStatus === 'out') filter.stock = 0;
  if (params.stockStatus === 'low') filter.stock = { $gt: 0, $lte: lowStockThreshold };

  if (and.length) filter.$and = and;
  return filter;
}

export async function listProducts(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const filter = await buildFilter(params, options);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(buildSort(params.sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(CATEGORY_POPULATE),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  };
}

/** Sections for the home page, fetched in parallel in one request. */
export async function getHomeCollections(limit = 8) {
  const base = await buildFilter({});
  const find = (extra, sort) =>
    Product.find({ ...base, ...extra })
      .sort(sort)
      .limit(limit)
      .populate(CATEGORY_POPULATE);

  const [featured, bestSellers, newArrivals, trending] = await Promise.all([
    find({ featured: true }, { createdAt: -1 }),
    // Flagged products first, then top up with the products that actually sell the most.
    find({}, { bestSeller: -1, soldCount: -1, rating: -1, _id: -1 }),
    // Flagged products first, then top up with the newest products.
    find({}, { newArrival: -1, createdAt: -1, _id: -1 }),
    find({}, { soldCount: -1, rating: -1, createdAt: -1, _id: -1 }),
  ]);

  return { featured, bestSellers, newArrivals, trending };
}

export async function getCategoriesWithCounts({ includeInactive = false } = {}) {
  const [categories, counts] = await Promise.all([
    Category.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }),
    Product.aggregate([
      { $match: includeInactive ? {} : { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c.toJSON(), productCount: countMap.get(String(c._id)) || 0 }));
}

export async function getPriceRange() {
  const [range] = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: '$finalPrice' }, max: { $max: '$finalPrice' } } },
  ]);
  return range ? { min: range.min, max: range.max } : { min: 0, max: 0 };
}