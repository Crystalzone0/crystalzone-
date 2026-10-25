import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { newsletterLimiter } from '../middleware/rateLimiters.js';
import { newsletterSchema } from '../validators/contactValidators.js';
import { subscribe } from '../controllers/newsletterController.js';

const router = Router();

router.post('/subscribe', newsletterLimiter, validate(newsletterSchema), subscribe);

export default router;