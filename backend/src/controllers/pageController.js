import fs from 'node:fs';
import path from 'node:path';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { renderHtml, resolvePage } from '../services/seoService.js';

let template = null;
const loadTemplate = () => {
  if (template === null) template = fs.readFileSync(path.join(env.distPath, 'index.html'), 'utf8');
  return template;
};

/**
 * Every page of the built React app. The HTML gets the page's real title, description, Open Graph tags and
 * structured data (for crawlers and link previews that do not run JavaScript), and unknown pages answer with a real 404.
 * If the database is unavailable the plain page is still served.
 */
export const renderPage = asyncHandler(async (req, res) => {
  let meta = null;
  try {
    meta = await resolvePage(req.path, req.query);
  } catch (err) {
    console.error('Could not build page metadata:', err.message);
  }

  res.status(meta?.status ?? 200);
  res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  if (meta && meta.robots.includes('noindex')) res.set('X-Robots-Tag', meta.robots);

  res.send(meta ? renderHtml(loadTemplate(), meta) : loadTemplate());
});