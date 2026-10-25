import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { wishlistItemSchema, wishlistMergeSchema } from '../validators/cartValidators.js';
import {
  getWishlist,
  addItem,
  removeItem,
  toggleItem,
  mergeWishlist,
  moveToCart,
} from '../controllers/wishlistController.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/', validate(wishlistItemSchema), addItem);
router.post('/toggle', validate(wishlistItemSchema), toggleItem);
router.post('/merge', validate(wishlistMergeSchema), mergeWishlist);
router.post('/:productId/move-to-cart', validateObjectId('productId'), moveToCart);
router.delete('/:productId', validateObjectId('productId'), removeItem);

export default router;