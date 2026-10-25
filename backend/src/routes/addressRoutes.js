import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { addressSchema, addressUpdateSchema } from '../validators/addressValidators.js';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';

const router = Router();

router.use(protect);

router.get('/', listAddresses);
router.post('/', validate(addressSchema), createAddress);
router.put('/:id', validateObjectId('id'), validate(addressUpdateSchema), updateAddress);
router.delete('/:id', validateObjectId('id'), deleteAddress);

export default router;