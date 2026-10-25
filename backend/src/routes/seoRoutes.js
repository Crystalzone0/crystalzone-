import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { getRobotsTxt, getSitemapXml } from '../services/seoService.js';

const router = Router();

router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    res.type('application/xml').set('Cache-Control', 'public, max-age=600').send(await getSitemapXml());
  })
);

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(getRobotsTxt());
});

export default router;