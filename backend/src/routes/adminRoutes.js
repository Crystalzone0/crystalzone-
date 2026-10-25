import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { handleImageUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import { adminCatalogQuerySchema, deleteImageSchema } from '../validators/productValidators.js';
import {
  adminOrderQuerySchema,
  orderStatusSchema,
  orderNoteSchema,
  customerQuerySchema,
  customerStatusSchema,
  adminReviewQuerySchema,
  reviewModerationSchema,
  messageQuerySchema,
  messageStatusSchema,
  subscriberQuerySchema,
  settingsUpdateSchema,
} from '../validators/adminValidators.js';

import {
  listAdminProducts,
  getAdminProduct,
  uploadImages,
  deleteUploadedImage,
} from '../controllers/adminProductController.js';
import { listAdminCategories } from '../controllers/categoryController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import {
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  markShipped,
  markDelivered,
} from '../controllers/adminOrderController.js';
import { getInventory } from '../controllers/inventoryController.js';
import { listCustomers, getCustomer, setCustomerStatus } from '../controllers/adminCustomerController.js';
import { listAdminReviews, moderateReview, deleteReview } from '../controllers/reviewController.js';
import { listMessages, updateMessageStatus, deleteMessage } from '../controllers/contactController.js';
import {
  listSubscribers,
  exportSubscribers,
  deleteSubscriber,
} from '../controllers/newsletterController.js';
import { getSettings, updateSettings } from '../controllers/adminSettingsController.js';

const router = Router();

// Every route below requires a logged-in ADMIN. Customers receive 403 from the server.
router.use(protect, restrictTo('admin'));

// ---------- Dashboard ----------
router.get('/dashboard', getDashboard);

// ---------- Products, categories, images ----------
router.get('/products', validate(adminCatalogQuerySchema, 'query'), listAdminProducts);
router.get('/products/:id', validateObjectId('id'), getAdminProduct);
router.get('/categories', listAdminCategories);
router.post('/images', uploadLimiter, handleImageUpload, uploadImages);
router.delete('/images', uploadLimiter, validate(deleteImageSchema), deleteUploadedImage);

// ---------- Inventory ----------
router.get('/inventory', validate(adminCatalogQuerySchema, 'query'), getInventory);

// ---------- Orders ----------
router.get('/orders', validate(adminOrderQuerySchema, 'query'), listOrders);
router.get('/orders/:id', validateObjectId('id'), getOrder);
router.put('/orders/:id', validateObjectId('id'), validate(orderStatusSchema), updateOrderStatus);
router.post('/orders/:id/cancel', validateObjectId('id'), validate(orderNoteSchema), cancelOrder);
router.post('/orders/:id/ship', validateObjectId('id'), validate(orderNoteSchema), markShipped);
router.post('/orders/:id/deliver', validateObjectId('id'), validate(orderNoteSchema), markDelivered);

// ---------- Customers ----------
router.get('/customers', validate(customerQuerySchema, 'query'), listCustomers);
router.get('/customers/:id', validateObjectId('id'), getCustomer);
router.patch('/customers/:id/status', validateObjectId('id'), validate(customerStatusSchema), setCustomerStatus);

// ---------- Reviews ----------
router.get('/reviews', validate(adminReviewQuerySchema, 'query'), listAdminReviews);
router.patch('/reviews/:id', validateObjectId('id'), validate(reviewModerationSchema), moderateReview);
router.delete('/reviews/:id', validateObjectId('id'), deleteReview);

// ---------- Contact messages ----------
router.get('/messages', validate(messageQuerySchema, 'query'), listMessages);
router.patch('/messages/:id', validateObjectId('id'), validate(messageStatusSchema), updateMessageStatus);
router.delete('/messages/:id', validateObjectId('id'), deleteMessage);

// ---------- Newsletter subscribers ----------
router.get('/subscribers', validate(subscriberQuerySchema, 'query'), listSubscribers);
router.get('/subscribers/export', exportSubscribers); // declared before /:id
router.delete('/subscribers/:id', validateObjectId('id'), deleteSubscriber);

// ---------- Store settings ----------
router.get('/settings', getSettings);
router.put('/settings', validate(settingsUpdateSchema), updateSettings);

export default router;