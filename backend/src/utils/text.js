import sanitizeHtml from 'sanitize-html';

/**
 * Strips every HTML tag/attribute from user text (XSS defence for stored content).
 * React also escapes output, this protects emails, admin exports and future consumers.
 */
export function sanitizeText(value) {
  const clean = sanitizeHtml(String(value ?? ''), { allowedTags: [], allowedAttributes: {} });
  return clean
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** Escapes a string for safe use inside a RegExp (search inputs). */
export function escapeRegex(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}