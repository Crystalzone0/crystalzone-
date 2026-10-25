import { Category, Product } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { getCategoriesWithCounts } from '../services/productService.js';
import { releaseUnusedImages } from '../services/imageService.js';

const nameTaken = (name, exceptId = null) =>
  Category.exists({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });

/** GET /api/categories: active categories with product counts. */
export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await getCategoriesWithCounts();
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ success: true, categories });
});

/** GET /api/admin/categories: all categories, including hidden ones. */
export const listAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await getCategoriesWithCounts({ includeInactive: true });
  res.json({ success: true, categories });
});

/** POST /api/categories */
export const createCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (await nameTaken(data.name)) throw new AppError('A category with this name already exists', 409);

  if (data.sortOrder === undefined) {
    const last = await Category.findOne().sort({ sortOrder: -1 }).select('sortOrder');
    data.sortOrder = last ? last.sortOrder + 1 : 0;
  }
  if (data.image === null) delete data.image;

  const category = await Category.create(data);
  res.status(201).json({ success: true, message: 'Category created', category });
});

/** PUT /api/categories/:id: the slug never changes, so category URLs stay stable. */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const data = { ...req.body };

  if (data.name && (await nameTaken(data.name, category._id))) {
    throw new AppError('A category with this name already exists', 409);
  }
  if (data.image === null) data.image = { url: '', publicId: '' };

  const oldPublicId = category.image?.publicId;
  category.set(data);
  await category.save();

  if (oldPublicId && oldPublicId !== category.image?.publicId) {
    await releaseUnusedImages([oldPublicId]);
  }

  res.json({ success: true, message: 'Category updated', category });
});

/** DELETE /api/categories/:id: only when no products use it. */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  if (await Product.exists({ category: category._id })) {
    throw new AppError(
      'This category still has products. Move or delete them first, or hide the category instead.',
      409
    );
  }

  const publicId = category.image?.publicId;
  await category.deleteOne();
  if (publicId) await releaseUnusedImages([publicId]);

  res.json({ success: true, message: 'Category deleted' });
});