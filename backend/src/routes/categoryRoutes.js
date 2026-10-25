import { Router } from 'express';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { categorySchema, categoryUpdateSchema } from '../validators/categoryValidators.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = Router();

router.get('/', getCategories);

router.post('/', adminOnly, validate(categorySchema), createCategory);
router.put('/:id', adminOnly, validateObjectId('id'), validate(categoryUpdateSchema), updateCategory);
router.delete('/:id', adminOnly, validateObjectId('id'), deleteCategory);

export default router;