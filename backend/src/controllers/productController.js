import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  CATEGORY_POPULATE,
  buildFilter,
  listProducts,
  getHomeCollections,
  getCategoriesWithCounts,
  getPriceRange,
} from '../services/productService.js';

const SLUG = /^[a-z0-9-]+$/;
const shortCache = (res) => res.set('Cache-Control', 'public, max-age=30');

/** GET /api/products: search, filter, sort, paginate. */
export const getProducts = asyncHandler(async (req, res) => {
  const result = await listProducts(req.query);
  res.json({ success: true, ...result });
});

/** GET /api/products/catalog/home: featured, best sellers, new arrivals, trending. */
export const getHome = asyncHandler(async (req, res) => {
  const collections = await getHomeCollections(req.query.limit);
  shortCache(res);
  res.json({ success: true, ...collections });
});

/** GET /api/products/catalog/filters: categories with counts + price range for the shop sidebar. */
export const getFilters = asyncHandler(async (_req, res) => {
  const [categories, priceRange] = await Promise.all([getCategoriesWithCounts(), getPriceRange()]);
  shortCache(res);
  res.json({ success: true, categories, priceRange });
});

/** GET /api/products/catalog/by-slugs?slugs=a,b,c: used by "Recently viewed". */
export const getBySlugs = asyncHandler(async (req, res) => {
  const slugs = [
    ...new Set(
      req.query.slugs
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => SLUG.test(s))
    ),
  ].slice(0, 12);

  if (slugs.length === 0) return res.json({ success: true, products: [] });

    const visible = await buildFilter({}); // also hides products whose category is hidden
  const found = await Product.find({ ...visible, slug: { $in: slugs } }).populate(CATEGORY_POPULATE);
  const bySlug = new Map(found.map((p) => [p.slug, p]));
  const products = slugs.map((s) => bySlug.get(s)).filter(Boolean); // keep the requested order

  return res.json({ success: true, products });
});

/** GET /api/products/:slug */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase();
  if (!SLUG.test(slug)) throw new AppError('Product not found', 404);

    const visible = await buildFilter({}); // also hides products whose category is hidden
  const product = await Product.findOne({ ...visible, slug }).populate(CATEGORY_POPULATE);;
  if (!product) throw new AppError('Product not found', 404);

  res.json({ success: true, product });
});

/** GET /api/products/:slug/related: same category first, topped up with other popular products. */
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase();
  if (!SLUG.test(slug)) throw new AppError('Product not found', 404);

    const visibleFilter = await buildFilter({});
  const product = await Product.findOne({ ...visibleFilter, slug }).select('_id category');
  if (!product) throw new AppError('Product not found', 404);

  const LIMIT = 8;
  const base = await buildFilter({});
  const sort = { soldCount: -1, createdAt: -1, _id: -1 };

  const sameCategory = await Product.find({ ...base, _id: { $ne: product._id }, category: product.category })
    .sort(sort)
    .limit(LIMIT)
    .populate(CATEGORY_POPULATE);

  let related = sameCategory;
  if (related.length < LIMIT) {
    const excluded = [product._id, ...related.map((p) => p._id)];
    const others = await Product.find({ ...base, _id: { $nin: excluded } })
      .sort(sort)
      .limit(LIMIT - related.length)
      .populate(CATEGORY_POPULATE);
    related = [...related, ...others];
  }

  res.json({ success: true, products: related });
});