import { ContactMessage } from '../models/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/text.js';
import { buildPagination } from '../utils/pagination.js';
import { env } from '../config/env.js';
import { getSettings } from '../services/settingsService.js';
import { sendMail } from '../services/emailService.js';

const THANKS = 'Thank you for contacting us! We will get back to you shortly.';

/** POST /api/contact */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, message, website } = req.body;

  // Honeypot: real visitors never see this field. Pretend it worked and store nothing.
  if (website) return res.status(201).json({ success: true, message: THANKS });

  await ContactMessage.create({ name, email, phone: phone || '', message });

  // Plain-text alert to the store owner. Best effort: the message is already saved.
  getSettings()
    .then((settings) =>
      sendMail({
        to: env.ADMIN_NOTIFY_EMAIL || settings.email,
        subject: `New message from ${name.replace(/\s+/g, ' ')}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\n\n${message}`,
        replyTo: email,
      })
    )
    .catch(() => {});

  return res.status(201).json({ success: true, message: THANKS });
});

/** GET /api/admin/messages */
export const listMessages = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }];
  }

  const [messages, total, countRows] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ContactMessage.countDocuments(filter),
    ContactMessage.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    messages,
    pagination: buildPagination(page, limit, total),
    statusCounts: Object.fromEntries(countRows.map((r) => [r._id, r.count])),
  });
});

/** PATCH /api/admin/messages/:id  { status } */
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { status: req.body.status } },
    { new: true }
  );
  if (!message) throw new AppError('Message not found', 404);

  res.json({ success: true, message: 'Message updated', contactMessage: message });
});

/** DELETE /api/admin/messages/:id */
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new AppError('Message not found', 404);

  res.json({ success: true, message: 'Message deleted' });
});