import { NewsletterSubscriber } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { buildPagination } from '../utils/pagination.js';

/** POST /api/newsletter/subscribe: idempotent, and re-activates a previously removed address. */
export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return res.json({ success: true, message: 'You are subscribed. Thank you!', alreadySubscribed: true });
  }

  try {
    await NewsletterSubscriber.create({ email });
  } catch (err) {
    // Two identical requests raced: the address is already saved, which is what the visitor wanted.
    if (err.code !== 11000) throw err;
  }

  return res.status(201).json({ success: true, message: 'Thank you for subscribing!' });
});

/** GET /api/admin/subscribers */
export const listSubscribers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;

  const filter = {};
  if (search) filter.email = new RegExp(escapeRegex(search), 'i');

  const [subscribers, total, activeCount] = await Promise.all([
    NewsletterSubscriber.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NewsletterSubscriber.countDocuments(filter),
    NewsletterSubscriber.countDocuments({ isActive: true }),
  ]);

  res.json({ success: true, subscribers, activeCount, pagination: buildPagination(page, limit, total) });
});

// Spreadsheet programs run text starting with = + - @ as a formula, so those cells are neutralised.
const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** GET /api/admin/subscribers/export: CSV of active subscribers (for your email marketing tool). */
export const exportSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await NewsletterSubscriber.find({ isActive: true }).sort({ createdAt: -1 });

  const lines = ['email,subscribed_at'];
  for (const s of subscribers) lines.push(`${csvCell(s.email)},${csvCell(s.createdAt.toISOString())}`);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="crystal-zone-subscribers.csv"');
  res.send(`${lines.join('\n')}\n`);
});

/** DELETE /api/admin/subscribers/:id */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) throw new AppError('Subscriber not found', 404);

  res.json({ success: true, message: 'Subscriber removed' });
});