import { Product, Category, Cart, Wishlist, Review, Setting } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { CATEGORY_POPULATE, listProducts } from '../services/productService.js';
import {
  uploadImageFiles,
  releaseUnusedImages,
  isManagedPublicId,
} from '../services/imageService.js';

async function assertCategoryExists(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new AppError('The selected category does not exist', 400);
  }
}

function dedupeImages(images) {
  const seen = new Set();
  const result = [];
  for (const image of images) {
    if (!seen.has(image.url)) {
      seen.add(image.url);
      result.push(image);
    }
  }
  return result;
}

/** GET /api/admin/products: all products (including hidden), with search/filters/pagination. */
export const listAdminProducts = asyncHandler(async (req, res) => {
  let lowStockThreshold;
  if (req.query.stockStatus === 'low') {
    lowStockThreshold = (await Setting.getStore()).lowStockThreshold;
  }
  const result = await listProducts(req.query, { admin: true, lowStockThreshold });
  res.json({ success: true, ...result });
});

/** GET /api/admin/products/:id: full product for the edit form. */
export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(CATEGORY_POPULATE);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, product });
});

/** POST /api/products */
export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  await assertCategoryExists(data.category);
  if (await Product.exists({ sku: data.sku })) {
    throw new AppError('A product with this SKU already exists', 409);
  }
  if (data.images) data.images = dedupeImages(data.images);

  const product = await Product.create(data);
  await product.populate(CATEGORY_POPULATE);

  res.status(201).json({ success: true, message: 'Product created', product });
});

/** PUT /api/products/:id: partial update. Sending `images` replaces the list (order, primary, removals). */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const data = { ...req.body };

  if (data.category) await assertCategoryExists(data.category);
  if (
    data.sku &&
    data.sku !== product.sku &&
    (await Product.exists({ sku: data.sku, _id: { $ne: product._id } }))
  ) {
    throw new AppError('A product with this SKU already exists', 409);
  }

  const imagesBefore = product.images.map((img) => img.publicId).filter(Boolean);
  if (data.images) data.images = dedupeImages(data.images);

  product.set(data);
  await product.save(); // runs validators + recalculates discount, finalPrice, primary image
  await product.populate(CATEGORY_POPULATE);

  // Images the admin removed from the product are deleted from Cloudinary (if nobody else uses them).
  if (data.images) {
    const imagesAfter = new Set(product.images.map((img) => img.publicId));
    await releaseUnusedImages(imagesBefore.filter((id) => !imagesAfter.has(id)));
  }

  res.json({ success: true, message: 'Product updated', product });
});

/** PATCH /api/products/:id/stock: quick stock change (inventory screen, "mark out of stock" = 0). */
export const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { stock: req.body.stock } },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError('Product not found', 404);

  res.json({
    success: true,
    message: 'Stock updated',
    product: { id: product.id, name: product.name, sku: product.sku, stock: product.stock },
  });
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const publicIds = product.images.map((img) => img.publicId).filter(Boolean);
  await product.deleteOne();

  // Remove the product from carts, wishlists and reviews. Past orders keep their own snapshot.
  await Promise.all([
    Cart.updateMany({ 'items.product': product._id }, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({ products: product._id }, { $pull: { products: product._id } }),
    Review.deleteMany({ product: product._id }),
  ]);
  await releaseUnusedImages(publicIds);

  res.json({ success: true, message: 'Product deleted' });
});

/** POST /api/admin/images: multipart field "images" (up to 8). Returns [{ url, publicId }]. */
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('Please choose at least one image', 400);
  }
  const images = await uploadImageFiles(req.files);
  res.status(201).json({
    success: true,
    message: images.length === 1 ? 'Image uploaded' : `${images.length} images uploaded`,
    images,
  });
});

/**
 * DELETE /api/admin/images  { publicId }
 * For images uploaded in the form but not saved yet. An image still used by a product is kept.
 */
export const deleteUploadedImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!isManagedPublicId(publicId)) {
    throw new AppError('This image cannot be deleted through the API', 400);
  }
  const deleted = (await releaseUnusedImages([publicId])) > 0;
  res.json({ success: true, message: deleted ? 'Image deleted' : 'Image is still in use and was kept', deleted });
});