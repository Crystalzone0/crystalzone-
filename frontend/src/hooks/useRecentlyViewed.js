import { useMemo } from 'react';
import { storage } from '../utils/storage.js';
import { STORAGE_KEYS } from '../utils/constants.js';

const MAX_STORED = 10;

/** Remembers a product page the visitor opened (most recent first). */
export function recordRecentlyViewed(slug) {
  if (!slug) return;
  const list = storage.get(STORAGE_KEYS.recent, []);
  const previous = Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];
  storage.set(STORAGE_KEYS.recent, [slug, ...previous.filter((s) => s !== slug)].slice(0, MAX_STORED));
}

/** Slugs of recently viewed products, without the one currently on screen. */
export default function useRecentlyViewed(excludeSlug, limit = 4) {
  return useMemo(() => {
    const list = storage.get(STORAGE_KEYS.recent, []);
    if (!Array.isArray(list)) return [];
    return list.filter((s) => typeof s === 'string' && s !== excludeSlug).slice(0, limit);
  }, [excludeSlug, limit]);
}