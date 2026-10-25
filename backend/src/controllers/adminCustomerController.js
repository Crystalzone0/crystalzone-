import { User, Order, Address } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { buildPagination } from '../utils/pagination.js';

/** Order count and total spent per customer (cancelled orders excluded). */
async function statsFor(userIds) {
  if (userIds.length === 0) return new Map();

  const rows = await Order.aggregate([
    { $match: { user: { $in: userIds }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

const withStats = (user, stats) => {
  const s = stats.get(String(user._id));
  return {
    ...user.toJSON(),
    orderCount: s?.orderCount || 0,
    totalSpent: s?.totalSpent || 0,
    lastOrderAt: s?.lastOrderAt || null,
  };
};

/** GET /api/admin/customers */
export const listCustomers = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.query;

  const filter = { role: 'customer' };
  if (status) filter.isActive = status === 'active';
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total, disabled] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
    User.countDocuments({ role: 'customer', isActive: false }),
  ]);

  const stats = await statsFor(users.map((u) => u._id));

  res.json({
    success: true,
    customers: users.map((u) => withStats(u, stats)),
    pagination: buildPagination(page, limit, total),
    disabledCount: disabled,
  });
});

/** GET /api/admin/customers/:id: account information, orders and saved addresses. */
export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw new AppError('Customer not found', 404);

  const [stats, orders, addresses] = await Promise.all([
    statsFor([user._id]),
    Order.find({ user: user._id }).sort({ createdAt: -1, _id: -1 }).limit(50).select('-statusHistory'),
    Address.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 }),
  ]);

  res.json({ success: true, customer: withStats(user, stats), orders, addresses });
});

/** PATCH /api/admin/customers/:id/status  { isActive }: disabling blocks the very next request. */
export const setCustomerStatus = asyncHandler(async (req, res) => {
  // Only customer accounts can be changed here, so an admin can never lock out an admin.
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { $set: { isActive: req.body.isActive } },
    { new: true }
  );
  if (!user) throw new AppError('Customer not found', 404);

  res.json({
    success: true,
    message: user.isActive ? 'Account enabled' : 'Account disabled',
    customer: user,
  });
});