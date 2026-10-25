import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { addToCartSchema, updateCartSchema, guestCartSchema } from '../validators/cartValidators.js';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearAll,
  mergeCart,
  validateGuestCart,
} from '../controllers/cartController.js';

const router = Router();

// Public: live prices/stock for a cart stored in the visitor's browser.
router.post('/validate', validate(guestCartSchema), validateGuestCart);

// Everything below needs a logged-in customer.
router.use(protect);

router.get('/', getCart);
router.post('/', validate(addToCartSchema), addItem);
router.post('/merge', validate(guestCartSchema), mergeCart);
router.put('/:productId', validateObjectId('productId'), validate(updateCartSchema), updateItem);
router.delete('/', clearAll);
router.delete('/:productId', validateObjectId('productId'), removeItem);

export default router;