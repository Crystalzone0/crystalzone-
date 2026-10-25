import { Router } from 'express';
import { getFeaturedReviews } from '../controllers/featuredReviewController.js';

const router = Router();

router.get('/featured', getFeaturedReviews);

export default router;