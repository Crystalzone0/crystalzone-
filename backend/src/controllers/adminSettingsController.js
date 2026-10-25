import { Setting } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { clearSettingsCache } from '../services/settingsService.js';

/** GET /api/admin/settings */
export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ success: true, settings: await Setting.getStore() });
});

/** PUT /api/admin/settings: partial update; the storefront sees the change immediately. */
export const updateSettings = asyncHandler(async (req, res) => {
  const { socials, ...rest } = req.body;

  const settings = await Setting.getStore();
  settings.set(rest);
  if (socials) {
    for (const [network, url] of Object.entries(socials)) settings.set(`socials.${network}`, url);
  }
  await settings.save();
  clearSettingsCache();

  res.json({ success: true, message: 'Settings saved', settings });
});