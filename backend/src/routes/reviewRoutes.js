import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { createReviewSchema, reviewListQuerySchema } from '../validators/reviewValidators.js';
import { getProductReviews, createReview } from '../controllers/reviewController.js';

const router = Router();

// Mounted at /api/products, before the product router.
router.get(
  '/:id/reviews',
  validateObjectId('id'),
  optionalAuth,
  validate(reviewListQuerySchema, 'query'),
  getProductReviews
);
router.post('/:id/reviews', validateObjectId('id'), protect, validate(createReviewSchema), createReview);

export default router;