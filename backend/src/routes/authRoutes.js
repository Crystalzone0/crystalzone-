import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/authValidators.js';
import {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin-login', authLimiter, validate(loginSchema), adminLogin);
router.post('/logout', logout);

router.get('/me', optionalAuth, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/password', authLimiter, protect, validate(changePasswordSchema), changePassword);

export default router;