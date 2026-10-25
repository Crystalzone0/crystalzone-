import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import publicReviewRoutes from './publicReviewRoutes.js';
import productRoutes from './productRoutes.js';
import adminRoutes from './adminRoutes.js';
import cartRoutes from './cartRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import orderRoutes from './orderRoutes.js';
import contactRoutes from './contactRoutes.js';
import newsletterRoutes from './newsletterRoutes.js';
import addressRoutes from './addressRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', reviewRoutes); // /products/:id/reviews (must come before productRoutes)
router.use('/products', productRoutes);
router.use('/reviews', publicReviewRoutes); // /reviews/featured
router.use('/admin', adminRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/settings', settingsRoutes);
router.use('/orders', orderRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/addresses', addressRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: Math.round(process.uptime()),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

export default router;