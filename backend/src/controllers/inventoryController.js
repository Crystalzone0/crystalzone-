import { Product } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildPagination } from '../utils/pagination.js';
import { CATEGORY_POPULATE, buildFilter } from '../services/productService.js';
import { getSettings } from '../services/settingsService.js';

const stockStatus = (stock, threshold) => (stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'in');

/**
 * GET /api/admin/inventory
 * Query: q, category, stockStatus (in | low | out), status (active | inactive), page, limit
 * Lowest stock first, so out-of-stock and low-stock products are at the top.
 * Stock is changed with PATCH /api/products/:id/stock.
 */
export const getInventory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { lowStockThreshold: threshold } = await getSettings();

  const filter = await buildFilter(req.query, { admin: true, lowStockThreshold: threshold });

  const [products, total, [summary]] = await Promise.all([
    Product.find(filter)
      .sort({ stock: 1, name: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(CATEGORY_POPULATE),
    Product.countDocuments(filter),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: '$stock' },
          stockValue: { $sum: { $multiply: ['$stock', '$finalPrice'] } },
          outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', threshold] }] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const totals = summary || { totalProducts: 0, totalUnits: 0, stockValue: 0, outOfStock: 0, lowStock: 0 };

  res.json({
    success: true,
    summary: {
      totalProducts: totals.totalProducts,
      totalUnits: totals.totalUnits,
      stockValue: totals.stockValue,
      outOfStock: totals.outOfStock,
      lowStock: totals.lowStock,
      inStock: totals.totalProducts - totals.outOfStock - totals.lowStock,
      lowStockThreshold: threshold,
    },
    items: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.primaryImage,
      category: p.category?.name || '',
      price: p.price,
      finalPrice: p.finalPrice,
      stock: p.stock,
      status: stockStatus(p.stock, threshold),
      isActive: p.isActive,
    })),
    pagination: buildPagination(page, limit, total),
  });
});