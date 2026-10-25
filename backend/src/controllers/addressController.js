import { Address } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const MAX_ADDRESSES = 5;

/** Makes one address the default and clears the flag on all the customer's others. */
const unsetOtherDefaults = (userId, keepId) =>
  Address.updateMany({ user: userId, _id: { $ne: keepId } }, { $set: { isDefault: false } });

/** GET /api/addresses */
export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, addresses });
});

/** POST /api/addresses: the first address becomes the default automatically. */
export const createAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= MAX_ADDRESSES) {
    throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses. Please delete one first.`, 400);
  }

  const data = { ...req.body, user: req.user._id };
  if (count === 0) data.isDefault = true;

  const address = await Address.create(data);
  if (address.isDefault) await unsetOtherDefaults(req.user._id, address._id);

  res.status(201).json({ success: true, message: 'Address saved', address });
});

/** PUT /api/addresses/:id */
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new AppError('Address not found', 404);

  const data = { ...req.body };
  // The default address cannot be un-defaulted directly: choose another address as the default instead.
  if (data.isDefault === false && address.isDefault) delete data.isDefault;

  address.set(data);
  await address.save();
  if (address.isDefault) await unsetOtherDefaults(req.user._id, address._id);

  res.json({ success: true, message: 'Address updated', address });
});

/** DELETE /api/addresses/:id: if it was the default, the newest remaining address takes over. */
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new AppError('Address not found', 404);

  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (next) await Address.updateOne({ _id: next._id }, { $set: { isDefault: true } });
  }

  res.json({ success: true, message: 'Address deleted' });
});