import Setting from '../models/Setting.js';
import { env } from '../config/env.js';

const TTL_MS = 15 * 1000;

let cached = null;
let cachedAt = 0;

/** Store settings as a plain object, cached for a few seconds (cart and checkout call this a lot). */
export async function getSettings() {
  if (!env.isTest && cached && Date.now() - cachedAt < TTL_MS) return cached;

  const doc = await Setting.getStore();
  cached = doc.toJSON();
  cachedAt = Date.now();
  return cached;
}

/** Call after settings are edited so the change is visible immediately. */
export function clearSettingsCache() {
  cached = null;
  cachedAt = 0;
}