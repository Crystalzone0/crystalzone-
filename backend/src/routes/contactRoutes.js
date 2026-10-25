import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiters.js';
import { contactSchema } from '../validators/contactValidators.js';
import { submitContact } from '../controllers/contactController.js';

const router = Router();

router.post('/', contactLimiter, validate(contactSchema), submitContact);

export default router;