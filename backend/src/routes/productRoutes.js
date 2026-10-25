import { Router } from 'express';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import {
  catalogQuerySchema,
  homeQuerySchema,
  slugsQuerySchema,
  productCreateSchema,
  productUpdateSchema,
  stockUpdateSchema,
} from '../validators/productValidators.js';
import {
  getProducts,
  getHome,
  getFilters,
  getBySlugs,
  getProductBySlug,
  getRelatedProducts,
} from '../controllers/productController.js';
import {
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} from '../controllers/adminProductController.js';

const router = Router();

// ---------- Public catalog ----------
router.get('/', validate(catalogQuerySchema, 'query'), getProducts);

// Two-segment paths, so they can never collide with a product slug.
router.get('/catalog/home', validate(homeQuerySchema, 'query'), getHome);
router.get('/catalog/filters', getFilters);
router.get('/catalog/by-slugs', validate(slugsQuerySchema, 'query'), getBySlugs);

router.get('/:slug/related', getRelatedProducts);
router.get('/:slug', getProductBySlug);

// ---------- Admin only (authorization enforced on the server) ----------
router.post('/', adminOnly, validate(productCreateSchema), createProduct);
router.put('/:id', adminOnly, validateObjectId('id'), validate(productUpdateSchema), updateProduct);
router.patch('/:id/stock', adminOnly, validateObjectId('id'), validate(stockUpdateSchema), updateStock);
router.delete('/:id', adminOnly, validateObjectId('id'), deleteProduct);

export default router;