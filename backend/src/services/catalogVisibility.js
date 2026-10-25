import Product from '../models/Product.js';
import { CATEGORY_POPULATE, buildFilter } from './productService.js';

/**
 * Products a shopper is allowed to see and buy: active, and in a category that is not hidden.
 * Cart and wishlist logic uses these so hidden or deleted products can never be added or bought.
 */
export async function findVisibleProduct(id) {
  const filter = await buildFilter({});
  return Product.findOne({ ...filter, _id: id }).populate(CATEGORY_POPULATE);
}

export async function findVisibleProducts(ids) {
  if (!ids.length) return [];
  const filter = await buildFilter({});
  return Product.find({ ...filter, _id: { $in: ids } }).populate(CATEGORY_POPULATE);
}